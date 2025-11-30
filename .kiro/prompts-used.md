# Key Prompts Used with Kiro AI

This document contains examples of prompts that were particularly effective during development.

## Infrastructure Setup

### Initial CDK Stack
```
Create an AWS CDK stack for a serverless cloud drive application with:
- S3 bucket for file storage with encryption and CORS
- DynamoDB table for metadata with GSI for folder queries
- Lambda functions for file operations (upload, download, list, create, update, delete)
- API Gateway REST API with CORS
- EventBridge rule for AI processing
- Proper IAM roles with least privilege
```

### DynamoDB Schema
```
Design a single-table DynamoDB schema for a hierarchical file system with:
- Support for files and folders
- Efficient parent-child queries
- User isolation
- Ability to move files between folders
```

## Backend Development

### Lambda Function
```
Create a TypeScript Lambda function that:
- Generates presigned S3 URLs for file uploads
- Creates metadata entry in DynamoDB
- Returns upload URL and item ID to frontend
- Handles errors gracefully
```

### AI Processing
```
Build an AI processing Lambda that:
- Detects file type from S3 metadata
- Routes images to Rekognition for label detection
- Routes PDFs to Textract for text extraction
- Routes text files to Comprehend for key phrase extraction
- Updates DynamoDB with AI metadata
```

## Frontend Development

### React Component
```
Create a React component for a file grid view with:
- TypeScript interfaces
- Thumbnail display for images
- Context menu on right-click
- Drag-and-drop support
- Loading states
- Error handling
```

### Custom Hook
```
Build a custom React hook for file uploads that:
- Tracks upload progress
- Supports multiple files
- Handles errors and retries
- Updates UI state
- Calls API to get presigned URL
```

## Debugging

### CORS Issues
```
I'm getting CORS errors when my React frontend calls the API Gateway.
The error is: "Access to fetch has been blocked by CORS policy"
Here's my API Gateway configuration: [paste config]
```

### Lambda Timeout
```
My AI processing Lambda is timing out after 3 seconds.
It needs to call Rekognition, Textract, and Comprehend.
How can I optimize this?
```

## Optimization

### Performance
```
My file list is re-rendering too often. Here's my component: [paste code]
How can I optimize it with React.memo and useMemo?
```

### Cost Reduction
```
My AWS bill is higher than expected. Here's my usage:
- S3: 100GB storage, 10K requests/day
- Lambda: 50K invocations/day
- DynamoDB: 5K reads/writes per day
How can I reduce costs?
```

## Documentation

### Architecture Diagram
```
Create a text-based architecture diagram showing:
- User browser → API Gateway → Lambda → S3/DynamoDB
- S3 events → EventBridge → AI Lambda → AI Services
- Include all AWS services used
```

### API Documentation
```
Generate API documentation for my endpoints:
- POST /files/upload
- GET /items?parentId=xxx
- POST /folders
- PUT /items/{id}
- DELETE /items/{id}
- GET /items/{id}/download
Include request/response examples
```

## Tips for Effective Prompts

1. **Be Specific**: Include exact requirements and constraints
2. **Provide Context**: Share relevant code, error messages, or configurations
3. **Ask for Explanations**: Request "why" behind decisions
4. **Iterate**: Start simple, then add complexity
5. **Request Best Practices**: Ask about security, performance, cost optimization

## Example Conversation Flow

**Me**: "I need to build a serverless file storage app on AWS"

**Kiro**: "Great! Let's start with the architecture. You'll need..."

**Me**: "How should I structure the DynamoDB table for folders?"

**Kiro**: "Use a single-table design with..."

**Me**: "The CORS isn't working. Here's my error: [paste]"

**Kiro**: "The issue is in your API Gateway configuration..."

**Me**: "How can I add AI tagging to uploaded files?"

**Kiro**: "Use EventBridge to trigger a Lambda when files are uploaded..."

## Conclusion

Effective prompts are:
- Clear and specific
- Include relevant context
- Ask for explanations, not just code
- Iterate based on responses
- Focus on learning, not just solutions

---

*These prompts helped build a production-ready application in 4 weeks.*
