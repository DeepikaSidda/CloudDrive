import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse, getUserIdFromEvent } from './utils';

const s3Client = new S3Client({ region: process.env.REGION });
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

    // Get item from DynamoDB
    const result = await docClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `ITEM#${itemId}`,
        },
      })
    );

    const item = result.Item;
    if (!item) {
      return errorResponse('Item not found', 404);
    }

    if (item.type !== 'file') {
      return errorResponse('Cannot download a folder');
    }

    // Generate presigned URL for download
    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: item.s3Key,
      ResponseContentDisposition: `attachment; filename="${item.name}"`,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return successResponse({
      downloadUrl,
      fileName: item.name,
      mimeType: item.mimeType,
      size: item.size,
    });
  } catch (error) {
    console.error('Download error:', error);
    return errorResponse('Failed to generate download URL', 500);
  }
}
