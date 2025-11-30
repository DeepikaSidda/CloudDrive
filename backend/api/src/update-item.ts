import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse, getUserIdFromEvent } from './utils';
import { UpdateItemRequest } from './types';

const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

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

    const body: UpdateItemRequest = JSON.parse(event.body || '{}');
    if (!body.name && !body.parentId && body.starred === undefined && body.deleted === undefined && body.isSecret === undefined) {
      return errorResponse('Must provide name, parentId, starred, deleted, or isSecret to update');
    }

    // First, get the current item to determine its type
    const getResult = await docClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: itemId.startsWith('ITEM#') ? itemId : `ITEM#${itemId}`,
        },
      })
    );

    let item = getResult.Item;

    // If not found as ITEM, try as FOLDER
    if (!item) {
      const folderResult = await docClient.send(
        new GetCommand({
          TableName: process.env.TABLE_NAME,
          Key: {
            PK: `USER#${userId}`,
            SK: `FOLDER#${itemId}`,
          },
        })
      );
      item = folderResult.Item;
    }

    if (!item) {
      return errorResponse('Item not found', 404);
    }

    // Build update expression
    const updates: string[] = [];
    const attributeNames: Record<string, string> = {};
    const attributeValues: Record<string, any> = {};

    if (body.name) {
      updates.push('#name = :name');
      attributeNames['#name'] = 'name';
      attributeValues[':name'] = body.name;

      // Update GSI1SK
      updates.push('GSI1SK = :gsi1sk');
      attributeValues[':gsi1sk'] = `TYPE#${item.type}#NAME#${body.name}`;
    }

    if (body.parentId) {
      updates.push('parentId = :parentId');
      attributeValues[':parentId'] = body.parentId;

      // Update GSI1PK
      updates.push('GSI1PK = :gsi1pk');
      attributeValues[':gsi1pk'] = `USER#${userId}#PARENT#${body.parentId}`;
    }

    if (body.starred !== undefined) {
      updates.push('starred = :starred');
      attributeValues[':starred'] = body.starred;
    }

    if (body.deleted !== undefined) {
      updates.push('deleted = :deleted');
      attributeValues[':deleted'] = body.deleted;
      
      if (body.deleted) {
        updates.push('deletedAt = :deletedAt');
        attributeValues[':deletedAt'] = new Date().toISOString();
      }
    }

    if (body.isSecret !== undefined) {
      updates.push('isSecret = :isSecret');
      attributeValues[':isSecret'] = body.isSecret;
    }

    updates.push('updatedAt = :updatedAt');
    attributeValues[':updatedAt'] = new Date().toISOString();

    await docClient.send(
      new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          PK: item.PK,
          SK: item.SK,
        },
        UpdateExpression: `SET ${updates.join(', ')}`,
        ExpressionAttributeNames: Object.keys(attributeNames).length > 0 ? attributeNames : undefined,
        ExpressionAttributeValues: attributeValues,
      })
    );

    return successResponse({
      message: 'Item updated successfully',
      itemId,
    });
  } catch (error) {
    console.error('Update item error:', error);
    return errorResponse('Failed to update item', 500);
  }
}
