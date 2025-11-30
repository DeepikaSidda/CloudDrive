import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, DeleteCommand, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse, getUserIdFromEvent } from './utils';

const s3Client = new S3Client({ region: process.env.REGION });
const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

async function deleteItemRecursive(userId: string, itemId: string, sk: string): Promise<void> {
  // Get the item
  const getResult = await docClient.send(
    new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: sk },
    })
  );

  const item = getResult.Item;
  if (!item) return;

  // If it's a folder, recursively delete children
  if (item.type === 'folder') {
    const children = await docClient.send(
      new QueryCommand({
        TableName: process.env.TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}#PARENT#${itemId}`,
        },
      })
    );

    // Delete all children
    for (const child of children.Items || []) {
      await deleteItemRecursive(userId, child.itemId, child.SK);
    }
  }

  // If it's a file, delete from S3
  if (item.type === 'file' && item.s3Key) {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: item.s3Key,
      })
    );
  }

  // Delete from DynamoDB
  await docClient.send(
    new DeleteCommand({
      TableName: process.env.TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: sk },
    })
  );
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    const itemId = event.pathParameters?.itemId;
    if (!itemId) {
      return errorResponse('Missing itemId');
    }

    // Try both ITEM and FOLDER prefixes
    let sk = `ITEM#${itemId}`;
    let getResult = await docClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: sk },
      })
    );

    if (!getResult.Item) {
      sk = `FOLDER#${itemId}`;
      getResult = await docClient.send(
        new GetCommand({
          TableName: process.env.TABLE_NAME,
          Key: { PK: `USER#${userId}`, SK: sk },
        })
      );
    }

    if (!getResult.Item) {
      return errorResponse('Item not found', 404);
    }

    // Recursively delete
    await deleteItemRecursive(userId, itemId, sk);

    return successResponse({
      message: 'Item deleted successfully',
      itemId,
    });
  } catch (error) {
    console.error('Delete item error:', error);
    return errorResponse('Failed to delete item', 500);
  }
}
