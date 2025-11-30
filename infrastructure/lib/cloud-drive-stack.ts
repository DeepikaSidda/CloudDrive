import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class CloudDriveStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========== S3 Bucket ==========
    const filesBucket = new s3.Bucket(this, 'FilesBucket', {
      bucketName: `smart-cloud-drive-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ['*'], // Restrict in production
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
        },
      ],
      lifecycleRules: [
        {
          id: 'intelligent-tiering',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(0),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ========== DynamoDB Table ==========
    const itemsTable = new dynamodb.Table(this, 'ItemsTable', {
      tableName: 'CloudDriveItems',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI for querying by parent folder
    itemsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ========== No Authentication (Open Access) ==========
    // Authentication removed for simplicity - all users share the same storage

    // ========== Lambda Functions ==========
    
    // Common Lambda environment variables
    const commonEnv = {
      TABLE_NAME: itemsTable.tableName,
      BUCKET_NAME: filesBucket.bucketName,
      REGION: this.region,
    };

    // Note: Build backend manually before deploying (no Docker required)
    // Run: cd backend/api && npm install && npm run build

    // Upload Handler
    const uploadHandler = new lambda.Function(this, 'UploadHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/upload.handler',
      code: lambda.Code.fromAsset('../backend/api'),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(10),
      memorySize: 512,
    });

    // List Items Handler
    const listItemsHandler = new lambda.Function(this, 'ListItemsHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/list-items.handler',
      code: lambda.Code.fromAsset('../backend/api'),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(10),
      memorySize: 512,
    });

    // Create Folder Handler
    const createFolderHandler = new lambda.Function(this, 'CreateFolderHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/create-folder.handler',
      code: lambda.Code.fromAsset('../backend/api'),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(10),
      memorySize: 512,
    });

    // Update Item Handler (rename, move)
    const updateItemHandler = new lambda.Function(this, 'UpdateItemHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/update-item.handler',
      code: lambda.Code.fromAsset('../backend/api'),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(10),
      memorySize: 512,
    });

    // Delete Item Handler
    const deleteItemHandler = new lambda.Function(this, 'DeleteItemHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/delete-item.handler',
      code: lambda.Code.fromAsset('../backend/api'),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(10),
      memorySize: 512,
    });

    // Download Handler
    const downloadHandler = new lambda.Function(this, 'DownloadHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/download.handler',
      code: lambda.Code.fromAsset('../backend/api'),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(10),
      memorySize: 512,
    });

    // Thumbnail Handler
    const thumbnailHandler = new lambda.Function(this, 'ThumbnailHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/thumbnail.handler',
      code: lambda.Code.fromAsset('../backend/api'),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(10),
      memorySize: 512,
    });

    // Analytics Handler
    const analyticsHandler = new lambda.Function(this, 'AnalyticsHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/analytics.handler',
      code: lambda.Code.fromAsset('../backend/api'),
      environment: commonEnv,
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
    });

    // Grant CloudWatch read permissions to analytics handler
    analyticsHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'cloudwatch:GetMetricStatistics',
          'cloudwatch:ListMetrics',
          's3:GetBucketLocation',
          's3:ListBucket',
        ],
        resources: ['*'],
      })
    );

    // Grant permissions to API functions
    const apiFunctions = [
      uploadHandler,
      listItemsHandler,
      createFolderHandler,
      updateItemHandler,
      deleteItemHandler,
      downloadHandler,
      thumbnailHandler,
      analyticsHandler,
    ];

    apiFunctions.forEach((fn) => {
      itemsTable.grantReadWriteData(fn);
      filesBucket.grantReadWrite(fn);
    });

    // AI Processor Lambda
    const aiProcessorHandler = new lambda.Function(this, 'AiProcessorHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'dist/index.handler',
      code: lambda.Code.fromAsset('../backend/ai-processor'),
      environment: commonEnv,
      timeout: cdk.Duration.minutes(5),
      memorySize: 2048,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant AI permissions
    itemsTable.grantReadWriteData(aiProcessorHandler);
    filesBucket.grantRead(aiProcessorHandler);
    
    aiProcessorHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'rekognition:DetectLabels',
          'rekognition:DetectText',
          'rekognition:DetectModerationLabels',
          'textract:DetectDocumentText',
          'textract:AnalyzeDocument',
          'comprehend:DetectEntities',
          'comprehend:DetectKeyPhrases',
          'comprehend:DetectSentiment',
        ],
        resources: ['*'],
      })
    );

    // EventBridge rule for S3 uploads
    const s3UploadRule = new events.Rule(this, 'S3UploadRule', {
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [filesBucket.bucketName],
          },
        },
      },
    });

    s3UploadRule.addTarget(new targets.LambdaFunction(aiProcessorHandler));

    // Enable EventBridge notifications on S3 bucket
    filesBucket.enableEventBridgeNotification();

    // ========== API Gateway ==========
    const api = new apigateway.RestApi(this, 'CloudDriveApi', {
      restApiName: 'Smart Cloud Drive API',
      description: 'API for Smart Cloud Drive application',
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // Restrict in production
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });

    // API Resources (No Authorization - Open Access)
    const files = api.root.addResource('files');
    const folders = api.root.addResource('folders');
    const items = api.root.addResource('items');
    const itemById = items.addResource('{itemId}');
    const download = itemById.addResource('download');

    // API Methods (No Authorization Required)
    files.addResource('upload').addMethod(
      'POST',
      new apigateway.LambdaIntegration(uploadHandler)
    );

    folders.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createFolderHandler)
    );

    items.addMethod(
      'GET',
      new apigateway.LambdaIntegration(listItemsHandler)
    );

    itemById.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(updateItemHandler)
    );

    itemById.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(deleteItemHandler)
    );

    download.addMethod(
      'GET',
      new apigateway.LambdaIntegration(downloadHandler)
    );

    const thumbnail = itemById.addResource('thumbnail');
    thumbnail.addMethod(
      'GET',
      new apigateway.LambdaIntegration(thumbnailHandler)
    );

    const analytics = api.root.addResource('analytics');
    analytics.addMethod(
      'GET',
      new apigateway.LambdaIntegration(analyticsHandler)
    );

    // ========== Outputs ==========
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: filesBucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: itemsTable.tableName,
      description: 'DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
    });
  }
}
