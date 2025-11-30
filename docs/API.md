# API Documentation

Base URL: `https://{api-id}.execute-api.{region}.amazonaws.com/prod`

All endpoints require authentication via Cognito JWT token in the `Authorization` header:
```
Authorization: Bearer {jwt-token}
```

## Endpoints

### Upload File

**POST** `/files/upload`

Get a presigned URL for uploading a file to S3.

**Request Body:**
```json
{
  "fileName": "document.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf",
  "parentId": "root"
}
```

**Response:**
```json
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "itemId": "abc-123",
  "message": "Upload URL generated successfully"
}
```

**Usage:**
1. Call this endpoint to get presigned URL
2. Upload file directly to S3 using the URL with PUT request
3. File metadata is automatically created in DynamoDB
4. AI processing is triggered automatically

---

### Create Folder

**POST** `/folders`

Create a new folder.

**Request Body:**
```json
{
  "name": "Documents",
  "parentId": "root"
}
```

**Response:**
```json
{
  "item": {
    "itemId": "xyz-789",
    "name": "Documents",
    "type": "folder",
    "parentId": "root",
    "createdAt": "2025-11-30T10:00:00Z",
    "updatedAt": "2025-11-30T10:00:00Z"
  },
  "message": "Folder created successfully"
}
```

---

### List Items

**GET** `/items?parentId={parentId}`

List all files and folders in a parent folder.

**Query Parameters:**
- `parentId` (optional): Parent folder ID. Defaults to "root"

**Response:**
```json
{
  "items": [
    {
      "itemId": "abc-123",
      "name": "document.pdf",
      "type": "file",
      "mimeType": "application/pdf",
      "size": 1024000,
      "parentId": "root",
      "createdAt": "2025-11-30T10:00:00Z",
      "updatedAt": "2025-11-30T10:05:00Z",
      "aiMetadata": {
        "keywords": ["cloud", "storage"],
        "extractedText": "...",
        "confidence": 0.95
      }
    },
    {
      "itemId": "xyz-789",
      "name": "Documents",
      "type": "folder",
      "parentId": "root",
      "createdAt": "2025-11-30T09:00:00Z",
      "updatedAt": "2025-11-30T09:00:00Z"
    }
  ],
  "count": 2,
  "parentId": "root"
}
```

---

### Update Item

**PUT** `/items/{itemId}`

Rename or move a file/folder.

**Request Body:**
```json
{
  "name": "new-name.pdf",
  "parentId": "new-parent-id"
}
```

Either `name` or `parentId` (or both) must be provided.

**Response:**
```json
{
  "message": "Item updated successfully",
  "itemId": "abc-123"
}
```

---

### Delete Item

**DELETE** `/items/{itemId}`

Delete a file or folder. If deleting a folder, all contents are recursively deleted.

**Response:**
```json
{
  "message": "Item deleted successfully",
  "itemId": "abc-123"
}
```

---

### Download File

**GET** `/items/{itemId}/download`

Get a presigned URL for downloading a file.

**Response:**
```json
{
  "downloadUrl": "https://s3.amazonaws.com/...",
  "fileName": "document.pdf",
  "mimeType": "application/pdf",
  "size": 1024000
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message"
}
```

**Status Codes:**
- `400` - Bad Request (validation error)
- `404` - Not Found (item doesn't exist)
- `500` - Internal Server Error

---

## AI Metadata Structure

After a file is uploaded, the AI processor analyzes it and adds metadata:

### Images (via Rekognition)
```json
{
  "aiMetadata": {
    "labels": ["Person", "Outdoor", "Nature"],
    "extractedText": "Text detected in image",
    "confidence": 0.95
  }
}
```

### Documents (via Textract + Comprehend)
```json
{
  "aiMetadata": {
    "extractedText": "Full document text...",
    "keywords": ["cloud computing", "AWS", "storage"],
    "entities": [
      { "text": "Amazon", "type": "ORGANIZATION", "score": 0.99 },
      { "text": "Seattle", "type": "LOCATION", "score": 0.95 }
    ]
  }
}
```

### Text Files (via Comprehend)
```json
{
  "aiMetadata": {
    "extractedText": "File content...",
    "keywords": ["important", "deadline", "project"],
    "entities": [
      { "text": "John Doe", "type": "PERSON", "score": 0.98 }
    ]
  }
}
```

---

## Rate Limits

Default limits (can be customized via API Gateway Usage Plans):
- 100 requests per second
- 200 burst capacity

---

## Best Practices

1. **Presigned URLs**: Use for direct S3 uploads/downloads to avoid Lambda payload limits
2. **Pagination**: For large folders, implement pagination (not included in basic version)
3. **Caching**: Cache folder listings on frontend to reduce API calls
4. **Error Handling**: Always handle errors gracefully
5. **Retry Logic**: Implement exponential backoff for failed requests
