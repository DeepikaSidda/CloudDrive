import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3Client, ListObjectsV2Command, GetBucketLocationCommand } from '@aws-sdk/client-s3';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';

const s3Client = new S3Client({});
const cloudWatchClient = new CloudWatchClient({});
const BUCKET_NAME = process.env.BUCKET_NAME!;

// AWS S3 Standard pricing (US East - adjust based on your region)
const PRICING = {
  storage: 0.023, // per GB per month
  putRequest: 0.005 / 1000, // per 1000 requests
  getRequest: 0.0004 / 1000, // per 1000 requests
  dataTransfer: 0.09, // per GB (after first 100GB free)
};

interface StorageMetrics {
  totalSize: number;
  totalSizeGB: number;
  objectCount: number;
  estimatedMonthlyCost: number;
  costBreakdown: {
    storage: number;
    requests: number;
    dataTransfer: number;
  };
  byType: Record<string, { count: number; size: number }>;
  largestFiles: Array<{ key: string; size: number; lastModified: Date }>;
  storageClass: Record<string, number>;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const metrics = await getStorageMetrics();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(metrics),
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to get analytics' }),
    };
  }
};

async function getStorageMetrics(): Promise<StorageMetrics> {
  let totalSize = 0;
  let objectCount = 0;
  const byType: Record<string, { count: number; size: number }> = {};
  const largestFiles: Array<{ key: string; size: number; lastModified: Date }> = [];
  const storageClass: Record<string, number> = {};
  
  // List all objects in bucket
  let continuationToken: string | undefined;
  
  do {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    });
    
    const response = await s3Client.send(command);
    
    if (response.Contents) {
      for (const object of response.Contents) {
        const size = object.Size || 0;
        totalSize += size;
        objectCount++;
        
        // Track storage class
        const storageClassType = object.StorageClass || 'STANDARD';
        storageClass[storageClassType] = (storageClass[storageClassType] || 0) + size;
        
        // Categorize by file type
        const type = getFileType(object.Key || '');
        if (!byType[type]) {
          byType[type] = { count: 0, size: 0 };
        }
        byType[type].count++;
        byType[type].size += size;
        
        // Track largest files
        if (object.Key && object.LastModified) {
          largestFiles.push({
            key: object.Key,
            size,
            lastModified: object.LastModified,
          });
        }
      }
    }
    
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);
  
  // Sort and keep only top 10 largest files
  largestFiles.sort((a, b) => b.size - a.size);
  const top10Largest = largestFiles.slice(0, 10);
  
  // Get CloudWatch metrics for requests
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  let putRequests = 0;
  let getRequests = 0;
  
  try {
    // Get PUT requests
    const putMetrics = await cloudWatchClient.send(new GetMetricStatisticsCommand({
      Namespace: 'AWS/S3',
      MetricName: 'NumberOfObjects',
      Dimensions: [
        { Name: 'BucketName', Value: BUCKET_NAME },
        { Name: 'StorageType', Value: 'AllStorageTypes' },
      ],
      StartTime: oneDayAgo,
      EndTime: now,
      Period: 86400, // 1 day
      Statistics: ['Average'],
    }));
    
    if (putMetrics.Datapoints && putMetrics.Datapoints.length > 0) {
      putRequests = putMetrics.Datapoints[0].Average || 0;
    }
  } catch (error) {
    console.warn('Could not fetch CloudWatch metrics:', error);
  }
  
  // Calculate costs
  const totalSizeGB = totalSize / (1024 * 1024 * 1024);
  const storageCost = totalSizeGB * PRICING.storage;
  const requestCost = (putRequests * PRICING.putRequest) + (getRequests * PRICING.getRequest);
  const dataTransferCost = Math.max(0, totalSizeGB - 100) * PRICING.dataTransfer; // First 100GB free
  
  const estimatedMonthlyCost = storageCost + requestCost + dataTransferCost;
  
  return {
    totalSize,
    totalSizeGB: parseFloat(totalSizeGB.toFixed(2)),
    objectCount,
    estimatedMonthlyCost: parseFloat(estimatedMonthlyCost.toFixed(2)),
    costBreakdown: {
      storage: parseFloat(storageCost.toFixed(2)),
      requests: parseFloat(requestCost.toFixed(4)),
      dataTransfer: parseFloat(dataTransferCost.toFixed(2)),
    },
    byType,
    largestFiles: top10Largest,
    storageClass,
  };
}

function getFileType(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase();
  
  if (!ext) return 'Other';
  
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
  const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];
  const docExts = ['doc', 'docx', 'odt', 'rtf'];
  const pdfExts = ['pdf'];
  const textExts = ['txt', 'md', 'csv', 'log'];
  
  if (imageExts.includes(ext)) return 'Images';
  if (videoExts.includes(ext)) return 'Videos';
  if (docExts.includes(ext)) return 'Documents';
  if (pdfExts.includes(ext)) return 'PDFs';
  if (textExts.includes(ext)) return 'Text';
  
  return 'Other';
}
