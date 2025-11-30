import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { successResponse, errorResponse, getUserIdFromEvent, validateRequired } from './utils';
import { FileItem, UploadRequest } from './types';

const s3Client = new S3Client({ region: process.env.REGION });
const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    const body: UploadRequest = JSON.parse(event.body || '{}');
    const validationError = validateRequired(body, ['fileName', 'fileSize', 'mimeType', 'parentId']);
    if (validationError) {
      return errorResponse(validationError);
    }

    const itemId = uuidv4();
    const s3Key = `${userId}/${itemId}`;
    const now = new Date().toISOString();

    // Generate presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: s3Key,
      ContentType: body.mimeType,
      Metadata: {
        userId,
        itemId,
        originalName: body.fileName,
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Create metadata entry in DynamoDB
    const item: FileItem = {
      PK: `USER#${userId}`,
      SK: `ITEM#${itemId}`,
      GSI1PK: `USER#${userId}#PARENT#${body.parentId}`,
      GSI1SK: `TYPE#file#NAME#${body.fileName}`,
      itemId,
      userId,
      name: body.fileName,
      type: 'file',
      mimeType: body.mimeType,
      size: body.fileSize,
      s3Key,
      parentId: body.parentId,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: item,
      })
    );

    return successResponse({
      uploadUrl,
      itemId,
      message: 'Upload URL generated successfully',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse('Failed to generate upload URL', 500);
  }
}
