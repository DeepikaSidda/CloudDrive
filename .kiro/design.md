# Smart Cloud Drive - Design Document

## System Architecture

### High-Level Architecture
```
┌─────────────┐
│   CloudFront│ (CDN)
└──────┬──────┘
       │
┌──────▼──────┐
│  S3 Bucket  │ (Frontend)
└─────────────┘

┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
┌──────▼──────────┐
│  API Gateway    │
└──────┬──────────┘
       │
┌──────▼──────────┐
│  Lambda         │ ◄──── EventBridge
│  Functions      │
└──────┬──────────┘
       │
┌──────▼──────────┐
│  DynamoDB       │
│  S3 Storage     │
└─────────────────┘
```

## Component Design

### Frontend Components

#### 1. DriveLayout (Main Container)
- **Purpose**: Main application container
- **State Management**:
  - Current folder ID
  - View mode (grid/list)
  - Selected items
  - Current view (drive/recent/starred/analytics/trash/secret)
  - Secret Room unlock state
- **Key Features**:
  - File upload (drag-drop, file picker)
  - Folder navigation
  - Bulk operations
  - Secret Room management

#### 2. Sidebar
- **Purpose**: Navigation and filtering
- **Components**:
  - Logo (S3 bucket + folder icon)
  - Main navigation (My Drive, Recent, Starred, Analytics, Trash)
  - Secret Room button
  - Category filters (All, Images, Videos, Documents, PDFs)

#### 3. FileGrid / FileList
- **Purpose**: Display files in grid or list view
- **Features**:
  - Thumbnail preview
  - File metadata display
  - Context menu
  - Selection checkbox
  - Star badge for favorites
  - AI-generated tags

#### 4. ShareDialog
- **Purpose**: Generate shareable links
- **Features**:
  - Time unit selector (minutes/hours/days)
  - Quick select buttons
  - Custom time input
  - Copy to clipboard
  - Direct S3 presigned URL generation

#### 5. SecretRoomDialog
- **Purpose**: Password authentication for Secret Room
- **Features**:
  - Password setup (first time)
  - Password verification
  - Show/hide password toggle
  - Error handling

#### 6. StorageAnalytics
- **Purpose**: Visualize storage usage
- **Features**:
  - Total storage used
  - File count by type
  - Upload trends
  - Storage distribution charts

### Backend Services

#### 1. Upload Handler
- **Endpoint**: POST /files/upload
- **Function**: Handle file uploads
- **Process**:
  1. Generate unique file ID
  2. Create presigned S3 upload URL
  3. Store metadata in DynamoDB
  4. Return upload URL to client
  5. Trigger AI processing via EventBridge

#### 2. List Items Handler
- **Endpoint**: GET /items?folderId={id}
- **Function**: List files in folder
- **Process**:
  1. Query DynamoDB by folder ID
  2. Filter by user (default-user)
  3. Return file metadata

#### 3. Create Folder Handler
- **Endpoint**: POST /folders
- **Function**: Create new folder
- **Process**:
  1. Generate unique folder ID
  2. Store metadata in DynamoDB
  3. Return folder details

#### 4. Update Item Handler
- **Endpoint**: PUT /items/{itemId}
- **Function**: Update file/folder metadata
- **Operations**:
  - Rename
  - Move to folder
  - Star/unstar
  - Move to trash
  - Mark as secret

#### 5. Delete Item Handler
- **Endpoint**: DELETE /items/{itemId}
- **Function**: Permanently delete file
- **Process**:
  1. Delete from DynamoDB
  2. Delete from S3
  3. Return success

#### 6. Download Handler
- **Endpoint**: GET /items/{itemId}/download
- **Function**: Generate download URL
- **Process**:
  1. Verify item exists
  2. Generate presigned S3 URL
  3. Return download URL

#### 7. Share Handler
- **Endpoint**: POST /shares
- **Function**: Create shareable link
- **Process**:
  1. Generate unique share ID
  2. Calculate expiry time
  3. Generate presigned S3 URL
  4. Store share metadata
  5. Return share URL

#### 8. AI Processor
- **Trigger**: EventBridge on S3 upload
- **Function**: Process images with AI
- **Process**:
  1. Detect image upload event
  2. Generate thumbnail
  3. Extract labels (AWS Rekognition)
  4. Extract keywords
  5. Update DynamoDB metadata

#### 9. Analytics Handler
- **Endpoint**: GET /analytics
- **Function**: Calculate storage statistics
- **Process**:
  1. Query all user items
  2. Calculate totals by type
  3. Get CloudWatch metrics
  4. Return analytics data

### Data Models

#### DynamoDB Schema
```typescript
{
  PK: "USER#default-user",
  SK: "ITEM#{itemId}",
  itemId: string,
  name: string,
  type: "file" | "folder",
  parentId: string,
  s3Key?: string,
  size?: number,
  mimeType?: string,
  starred: boolean,
  deleted: boolean,
  isSecret: boolean,
  aiMetadata?: {
    labels: string[],
    keywords: string[],
    thumbnailKey?: string
  },
  createdAt: string,
  updatedAt: string
}

// Share records
{
  PK: "SHARE#{shareId}",
  SK: "SHARE#{shareId}",
  shareId: string,
  itemId: string,
  userId: string,
  permission: "view" | "download" | "edit",
  expiresAt: number,
  allowedEmails: string[],
  accessCount: number,
  createdAt: string
}
```

## Security Design

### Secret Room
- **Password Storage**: Base64 encoded in localStorage (client-side only)
- **Access Control**: State-based (resets on page load)
- **Operations**: All require unlock state
- **Auto-lock**: Triggers on navigation away

### File Sharing
- **URL Type**: S3 presigned URLs
- **Expiry**: Embedded in URL signature
- **Access**: No authentication required
- **Limitations**: Max 7 days (AWS S3 limit)

### API Security
- **CORS**: Enabled for all origins (open access)
- **HTTPS**: Required for all endpoints
- **Rate Limiting**: API Gateway throttling
- **Validation**: Input validation on all endpoints

## UI/UX Design

### Color Scheme
- **Primary**: Blue (#3b82f6)
- **Secondary**: Purple (#8b5cf6)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Danger**: Red (#ef4444)
- **Secret Room**: Purple (#a855f7)

### Layout
- **Sidebar**: 256px fixed width
- **Main Content**: Flexible width
- **Grid View**: Responsive columns (1-6 based on screen size)
- **List View**: Full width table

### Animations
- **Fade In**: Page transitions
- **Scale In**: Dialogs and modals
- **Blob Animation**: Background decorations
- **Hover Effects**: Buttons and cards

## Performance Optimizations

### Frontend
- **Code Splitting**: Lazy load components
- **Image Optimization**: Thumbnails for previews
- **Caching**: CloudFront CDN
- **Debouncing**: Search input

### Backend
- **Lambda Cold Start**: Minimal dependencies
- **DynamoDB**: Efficient queries with indexes
- **S3**: Intelligent tiering for cost optimization
- **EventBridge**: Async processing for AI features

## Deployment Strategy

### Infrastructure
- **IaC**: AWS CDK (TypeScript)
- **Regions**: us-east-1
- **Environments**: Single production environment

### CI/CD
- **Frontend**: Build → S3 → CloudFront invalidation
- **Backend**: Build → CDK deploy
- **Rollback**: CloudFormation stack rollback

### Monitoring
- **CloudWatch Logs**: Lambda function logs
- **CloudWatch Metrics**: API Gateway, Lambda, DynamoDB
- **Alarms**: Error rate, latency thresholds

## Future Enhancements
1. Multi-user support with authentication
2. Real-time collaboration
3. File versioning
4. Advanced AI features (OCR, document analysis)
5. Mobile app
6. Folder sharing
7. Public share page with access control
8. File comments and annotations
