# Architecture Deep Dive

## DynamoDB Schema

### Single Table Design

**Table Name**: `CloudDriveItems`

**Primary Key**:
- `PK` (Partition Key): `USER#{userId}`
- `SK` (Sort Key): `ITEM#{itemId}` or `FOLDER#{folderId}`

**GSI1** (for querying by parent folder):
- `GSI1PK`: `USER#{userId}#PARENT#{parentId}`
- `GSI1SK`: `TYPE#{file|folder}#NAME#{name}`

**Attributes**:
```json
{
  "PK": "USER#123",
  "SK": "ITEM#abc-456",
  "GSI1PK": "USER#123#PARENT#root",
  "GSI1SK": "TYPE#file#NAME#document.pdf",
  "itemId": "abc-456",
  "userId": "123",
  "name": "document.pdf",
  "type": "file",
  "mimeType": "application/pdf",
  "size": 1024000,
  "s3Key": "123/abc-456",
  "parentId": "root",
  "createdAt": "2025-11-30T10:00:00Z",
  "updatedAt": "2025-11-30T10:00:00Z",
  "aiMetadata": {
    "labels": ["document", "text"],
    "keywords": ["cloud", "storage", "aws"],
    "extractedText": "...",
    "confidence": 0.95
  }
}
```

**Folder Item**:
```json
{
  "PK": "USER#123",
  "SK": "FOLDER#xyz-789",
  "GSI1PK": "USER#123#PARENT#root",
  "GSI1SK": "TYPE#folder#NAME#Documents",
  "itemId": "xyz-789",
  "userId": "123",
  "name": "Documents",
  "type": "folder",
  "parentId": "root",
  "createdAt": "2025-11-30T10:00:00Z",
  "updatedAt": "2025-11-30T10:00:00Z"
}
```

### Access Patterns

1. **List items in folder**: Query GSI1 with `GSI1PK = USER#{userId}#PARENT#{parentId}`
2. **Get item by ID**: Query with `PK = USER#{userId}` and `SK = ITEM#{itemId}`
3. **Search by name**: Query GSI1 with begins_with on `GSI1SK`
4. **Get user's root items**: Query GSI1 with `GSI1PK = USER#{userId}#PARENT#root`

## S3 Structure

```
s3://smart-cloud-drive-{accountId}/
├── {userId}/
│   ├── {fileId1}           # Original file
│   ├── {fileId2}
│   └── thumbnails/
│       ├── {fileId1}.jpg   # Generated thumbnails
│       └── {fileId2}.jpg
```

**Why flat structure?**
- Hierarchy is in DynamoDB, not S3
- Easier to move files between folders (just update DynamoDB)
- Better S3 performance (no prefix hotspots)
- Simpler permissions (user-level prefix)

## API Endpoints

### Files & Folders

```
POST   /files/upload          # Get presigned URL for upload
POST   /folders               # Create folder
GET    /items                 # List items (query param: parentId)
GET    /items/{itemId}        # Get item details
PUT    /items/{itemId}        # Update item (rename, move)
DELETE /items/{itemId}        # Delete item
POST   /items/{itemId}/share  # Generate share link
GET    /files/{itemId}/download # Get presigned download URL
```

### Authentication

All endpoints are open access (no authentication required).

## AI Processing Pipeline

```
1. User uploads file → Frontend gets presigned URL from API
2. Frontend uploads directly to S3
3. S3 triggers EventBridge rule
4. EventBridge invokes AI Lambda
5. AI Lambda:
   - Detects file type
   - Calls appropriate AI service:
     * Images → Rekognition (labels, text detection)
     * PDFs/Docs → Textract (text extraction)
     * Text → Comprehend (entities, key phrases)
   - Updates DynamoDB with metadata
6. Frontend polls or uses WebSocket for status updates
```

## Security Model

### IAM Policies

**Lambda Execution Role**:
- DynamoDB: GetItem, PutItem, Query, UpdateItem (scoped to table)
- S3: GetObject, PutObject (scoped to user prefix)
- Rekognition/Textract/Comprehend: Detect* operations
- CloudWatch Logs: CreateLogGroup, CreateLogStream, PutLogEvents

### Data Encryption

- S3: SSE-S3 (AES-256)
- DynamoDB: Encryption at rest enabled
- API Gateway: TLS 1.2+

## Performance Optimization

1. **DynamoDB**: On-demand billing, auto-scaling for provisioned mode
2. **S3**: Transfer Acceleration for large uploads
3. **Lambda**: 
   - API functions: 512MB memory, 10s timeout
   - AI functions: 2048MB memory, 5min timeout
4. **CloudFront**: Cache static assets and thumbnails
5. **API Gateway**: Response caching (5min TTL)

## Cost Estimates (Monthly)

**Assumptions**: 10 users, 100GB storage, 1000 API calls/day

- S3: ~$2.30 (storage) + $0.50 (requests)
- DynamoDB: ~$1.25 (on-demand)
- Lambda: ~$5 (API) + $10 (AI processing)
- Rekognition: ~$10 (1000 images)
- Textract: ~$15 (500 pages)
- Comprehend: ~$5 (text analysis)
- API Gateway: ~$3.50

**Total**: ~$52/month

## Monitoring & Alerts

- CloudWatch Dashboards for Lambda metrics
- X-Ray tracing for API requests
- Alarms for:
  - Lambda errors > 1%
  - API Gateway 5xx errors
  - DynamoDB throttling
  - S3 4xx errors (permission issues)
