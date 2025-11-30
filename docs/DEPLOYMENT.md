# Deployment Guide

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured (`aws configure`)
- Node.js 20+ and npm
- AWS CDK CLI (`npm install -g aws-cdk`)

## Step 1: Deploy Infrastructure

```bash
cd infrastructure

# Install dependencies
npm install

# Bootstrap CDK (first time only)
cdk bootstrap

# Review changes
cdk diff

# Deploy
cdk deploy

# Note the outputs:
# - UserPoolId
# - UserPoolClientId
# - ApiUrl
# - BucketName
# - Region
```

## Step 2: Build Backend Functions

```bash
# Build API functions
cd ../backend/api
npm install
npm run build

# Build AI processor
cd ../ai-processor
npm install
npm run build
```

## Step 3: Configure Frontend

Create `frontend/.env` file with CDK outputs:

```env
VITE_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_API_URL=https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/prod
VITE_REGION=us-east-1
```

## Step 4: Build and Deploy Frontend

```bash
cd ../frontend
npm install
npm run build

# Deploy to S3 + CloudFront (optional)
# Or use Amplify Hosting, Vercel, Netlify, etc.
```

### Option A: Deploy to S3 + CloudFront

```bash
# Create S3 bucket for hosting
aws s3 mb s3://smart-cloud-drive-frontend

# Enable static website hosting
aws s3 website s3://smart-cloud-drive-frontend --index-document index.html

# Upload build
aws s3 sync dist/ s3://smart-cloud-drive-frontend --delete

# Create CloudFront distribution (optional, for HTTPS and CDN)
```

### Option B: Deploy to AWS Amplify

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Publish
amplify publish
```

## Step 5: Test the Application

1. Open the frontend URL
2. Sign up for a new account
3. Verify email
4. Sign in
5. Upload a test file
6. Check DynamoDB for AI metadata (may take 1-2 minutes)

## Monitoring

### CloudWatch Logs

```bash
# API Lambda logs
aws logs tail /aws/lambda/SmartCloudDriveStack-UploadHandler --follow

# AI Processor logs
aws logs tail /aws/lambda/SmartCloudDriveStack-AiProcessorHandler --follow
```

### DynamoDB

```bash
# Query items
aws dynamodb scan --table-name CloudDriveItems --max-items 10
```

### S3

```bash
# List files
aws s3 ls s3://smart-cloud-drive-{ACCOUNT_ID}/ --recursive
```

## Cleanup

To remove all resources:

```bash
cd infrastructure
cdk destroy

# Manually delete S3 buckets (CDK retains them by default)
aws s3 rb s3://smart-cloud-drive-{ACCOUNT_ID} --force
```

## Troubleshooting

### CORS Errors

- Check API Gateway CORS configuration
- Verify frontend is using correct API URL
- Check browser console for specific error

### Upload Fails

- Check S3 bucket CORS configuration
- Verify presigned URL is valid
- Check Lambda execution role permissions

### AI Metadata Not Appearing

- Check EventBridge rule is enabled
- Verify AI Lambda has correct permissions
- Check CloudWatch logs for errors
- Ensure file metadata includes itemId

## Security Hardening (Production)

1. **CORS**: Restrict to specific domains
   ```typescript
   allowOrigins: ['https://yourdomain.com']
   ```

2. **API Rate Limiting**: Add usage plans
   ```typescript
   api.addUsagePlan('UsagePlan', {
     throttle: { rateLimit: 100, burstLimit: 200 }
   });
   ```

3. **S3 Bucket Policy**: Add additional restrictions
4. **WAF**: Add AWS WAF to API Gateway
5. **CloudTrail**: Enable for audit logging
6. **Secrets Manager**: Store sensitive configuration

## Cost Optimization

1. **S3 Lifecycle**: Already configured with Intelligent-Tiering
2. **Lambda Reserved Concurrency**: Set limits to prevent runaway costs
3. **DynamoDB**: Use on-demand billing for variable workloads
4. **CloudWatch Logs**: Set retention period (7 days recommended)
5. **AI Services**: Consider caching results for duplicate files

## Performance Optimization

1. **API Gateway Caching**: Enable for GET requests
2. **CloudFront**: Use for static assets and API
3. **Lambda Provisioned Concurrency**: For frequently used functions
4. **DynamoDB DAX**: For read-heavy workloads
5. **S3 Transfer Acceleration**: For large file uploads
