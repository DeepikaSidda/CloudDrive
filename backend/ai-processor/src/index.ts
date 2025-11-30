import { EventBridgeEvent } from 'aws-lambda';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { RekognitionClient, DetectLabelsCommand, DetectTextCommand } from '@aws-sdk/client-rekognition';
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { ComprehendClient, DetectEntitiesCommand, DetectKeyPhrasesCommand } from '@aws-sdk/client-comprehend';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const s3Client = new S3Client({ region: process.env.REGION });
const rekognitionClient = new RekognitionClient({ region: process.env.REGION });
const textractClient = new TextractClient({ region: process.env.REGION });
const comprehendClient = new ComprehendClient({ region: process.env.REGION });
const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

interface S3EventDetail {
  bucket: { name: string };
  object: { key: string; size: number };
}

async function processImage(bucket: string, key: string) {
  console.log('Processing image with Rekognition:', key);

  const [labelsResult, textResult] = await Promise.all([
    rekognitionClient.send(
      new DetectLabelsCommand({
        Image: { S3Object: { Bucket: bucket, Name: key } },
        MaxLabels: 10,
        MinConfidence: 70,
      })
    ),
    rekognitionClient.send(
      new DetectTextCommand({
        Image: { S3Object: { Bucket: bucket, Name: key } },
      })
    ),
  ]);

  const labels = labelsResult.Labels?.map((l) => l.Name).filter(Boolean) as string[];
  const detectedText = textResult.TextDetections?.filter((t) => t.Type === 'LINE')
    .map((t) => t.DetectedText)
    .join(' ');

  return {
    labels,
    extractedText: detectedText,
    confidence: labelsResult.Labels?.[0]?.Confidence || 0,
  };
}

async function processDocument(bucket: string, key: string) {
  console.log('Processing document with Textract:', key);

  const result = await textractClient.send(
    new DetectDocumentTextCommand({
      Document: { S3Object: { Bucket: bucket, Name: key } },
    })
  );

  const extractedText = result.Blocks?.filter((b) => b.BlockType === 'LINE')
    .map((b) => b.Text)
    .join(' ') || '';

  // Use Comprehend for keyword extraction if text is available
  let keywords: string[] = [];
  let entities: Array<{ text: string; type: string; score: number }> = [];

  if (extractedText && extractedText.length > 10) {
    try {
      const [keyPhrasesResult, entitiesResult] = await Promise.all([
        comprehendClient.send(
          new DetectKeyPhrasesCommand({
            Text: extractedText.substring(0, 5000), // Comprehend limit
            LanguageCode: 'en',
          })
        ),
        comprehendClient.send(
          new DetectEntitiesCommand({
            Text: extractedText.substring(0, 5000),
            LanguageCode: 'en',
          })
        ),
      ]);

      keywords = keyPhrasesResult.KeyPhrases?.map((kp) => kp.Text).filter(Boolean) as string[];
      entities = entitiesResult.Entities?.map((e) => ({
        text: e.Text || '',
        type: e.Type || '',
        score: e.Score || 0,
      })) || [];
    } catch (error) {
      console.error('Comprehend error:', error);
    }
  }

  return {
    extractedText,
    keywords,
    entities,
  };
}

async function processText(bucket: string, key: string) {
  console.log('Processing text file with Comprehend:', key);

  // Get file content
  const result = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  const text = await result.Body?.transformToString() || '';

  if (text.length < 10) {
    return { extractedText: text, keywords: [], entities: [] };
  }

  try {
    const [keyPhrasesResult, entitiesResult] = await Promise.all([
      comprehendClient.send(
        new DetectKeyPhrasesCommand({
          Text: text.substring(0, 5000),
          LanguageCode: 'en',
        })
      ),
      comprehendClient.send(
        new DetectEntitiesCommand({
          Text: text.substring(0, 5000),
          LanguageCode: 'en',
        })
      ),
    ]);

    const keywords = keyPhrasesResult.KeyPhrases?.map((kp) => kp.Text).filter(Boolean) as string[];
    const entities = entitiesResult.Entities?.map((e) => ({
      text: e.Text || '',
      type: e.Type || '',
      score: e.Score || 0,
    })) || [];

    return { extractedText: text, keywords, entities };
  } catch (error) {
    console.error('Comprehend error:', error);
    return { extractedText: text, keywords: [], entities: [] };
  }
}

export async function handler(event: EventBridgeEvent<'Object Created', S3EventDetail>) {
  console.log('AI Processor triggered:', JSON.stringify(event, null, 2));

  try {
    const bucket = event.detail.bucket.name;
    const key = event.detail.object.key;

    // Skip thumbnails folder
    if (key.includes('/thumbnails/')) {
      console.log('Skipping thumbnail:', key);
      return;
    }

    // Get object metadata to determine file type
    const headResult = await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    const contentType = headResult.ContentType || '';
    const metadata = headResult.Metadata || {};
    const userId = metadata.userid;
    const itemId = metadata.itemid;

    if (!userId || !itemId) {
      console.error('Missing userId or itemId in metadata');
      return;
    }

    let aiMetadata: any = {};

    // Process based on content type
    if (contentType.startsWith('image/')) {
      console.log('Processing as image with Rekognition');
      aiMetadata = await processImage(bucket, key);
    } else if (contentType === 'application/pdf') {
      console.log('Processing as PDF with Textract');
      aiMetadata = await processDocument(bucket, key);
    } else if (contentType.startsWith('text/')) {
      console.log('Processing as text with Comprehend');
      aiMetadata = await processText(bucket, key);
    } else {
      console.log('Unsupported content type for AI processing:', contentType);
      // Still update with empty metadata so we don't keep retrying
      aiMetadata = { labels: [], extractedText: '', keywords: [] };
    }

    // Update DynamoDB with AI metadata
    await docClient.send(
      new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `ITEM#${itemId}`,
        },
        UpdateExpression: 'SET aiMetadata = :metadata, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':metadata': aiMetadata,
          ':updatedAt': new Date().toISOString(),
        },
      })
    );

    console.log('AI metadata updated successfully for item:', itemId);
  } catch (error) {
    console.error('AI processing error:', error);
    throw error;
  }
}
