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

    // For images, videos, and GIFs - generate presigned URL for the actual file
    // The browser will handle displaying it as a thumbnail
    const s3Key = item.s3Key;
    if (!s3Key) {
      return errorResponse('No file available', 404);
    }

    // Check if it's an image, video, or GIF
    const mimeType = item.mimeType || '';
    const isMedia = mimeType.startsWith('image/') || mimeType.startsWith('video/');
    
    if (!isMedia) {
      return errorResponse('Thumbnail not available for this file type', 404);
    }

    // Generate presigned URL for the actual file
    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: s3Key,
    });

    const thumbnailUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Redirect to the presigned URL so the image can be displayed directly
    return {
      statusCode: 302,
      headers: {
        'Location': thumbnailUrl,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
      body: '',
    };
  } catch (error) {
    console.error('Thumbnail error:', error);
    return errorResponse('Failed to get thumbnail URL', 500);
  }
}
