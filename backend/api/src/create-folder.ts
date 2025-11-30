import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { successResponse, errorResponse, getUserIdFromEvent, validateRequired } from './utils';
import { FileItem, CreateFolderRequest } from './types';

const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    const body: CreateFolderRequest = JSON.parse(event.body || '{}');
    const validationError = validateRequired(body, ['name', 'parentId']);
    if (validationError) {
      return errorResponse(validationError);
    }

    const itemId = uuidv4();
    const now = new Date().toISOString();

    const item: FileItem = {
      PK: `USER#${userId}`,
      SK: `FOLDER#${itemId}`,
      GSI1PK: `USER#${userId}#PARENT#${body.parentId}`,
      GSI1SK: `TYPE#folder#NAME#${body.name}`,
      itemId,
      userId,
      name: body.name,
      type: 'folder',
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
      item,
      message: 'Folder created successfully',
    }, 201);
  } catch (error) {
    console.error('Create folder error:', error);
    return errorResponse('Failed to create folder', 500);
  }
}
