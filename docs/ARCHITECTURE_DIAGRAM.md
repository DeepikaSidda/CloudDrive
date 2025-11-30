# Architecture Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER BROWSER                               │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    React Frontend                             │  │
│  │  - Tailwind CSS                                               │  │
│  │  - Grid/List View                                             │  │
│  │  - Drag & Drop Upload                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            │ HTTPS
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                      AWS CLOUD                                       │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                  API Gateway                                 │   │
│  │  - REST API                                                  │   │
│  │  - Open Access (No Authorization)                            │   │
│  │  - CORS Configuration                                        │   │
│  │  - Request Validation                                        │   │
│  └────────────────────────┬────────────────────────────────────┘   │
│                            │                                          │
│                            │ Invoke                                   │
│                            │                                          │
│  ┌────────────────────────▼────────────────────────────────────┐   │
│  │              Lambda Functions (API Layer)                    │   │
│  │                                                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│  │  │   Upload     │  │ List Items   │  │Create Folder │      │   │
│  │  │   Handler    │  │   Handler    │  │   Handler    │      │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │   │
│  │                                                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│  │  │   Update     │  │   Delete     │  │  Download    │      │   │
│  │  │   Handler    │  │   Handler    │  │   Handler    │      │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │   │
│  └────────────┬──────────────────────────────┬─────────────────┘   │
│               │                              │                       │
│               │ Read/Write                   │ Presigned URLs        │
│               │                              │                       │
│  ┌────────────▼──────────────┐  ┌───────────▼──────────────────┐  │
│  │      DynamoDB Table        │  │        Amazon S3             │  │
│  │   CloudDriveItems          │  │  smart-cloud-drive-{id}      │  │
│  │                            │  │                              │  │
│  │  - PK: USER#{userId}       │  │  /{userId}/{fileId}          │  │
│  │  - SK: ITEM#{itemId}       │  │  /thumbnails/                │  │
│  │  - GSI1: Parent queries    │  │                              │  │
│  │  - File metadata           │  │  - Encryption at rest        │  │
│  │  - AI metadata             │  │  - Intelligent-Tiering       │  │
│  │  - Folder structure        │  │  - CORS enabled              │  │
│  └────────────────────────────┘  └───────────┬──────────────────┘  │
│                                               │                      │
│                                               │ S3 Event             │
│                                               │                      │
│  ┌────────────────────────────────────────────▼─────────────────┐  │
│  │                    EventBridge                                │  │
│  │  - Rule: Object Created                                       │  │
│  │  - Filter: Exclude thumbnails                                 │  │
│  └────────────────────────────────────────────┬─────────────────┘  │
│                                               │                      │
│                                               │ Trigger              │
│                                               │                      │
│  ┌────────────────────────────────────────────▼─────────────────┐  │
│  │           Lambda Function (AI Processor)                      │  │
│  │                                                                │  │
│  │  1. Detect file type from S3 metadata                         │  │
│  │  2. Route to appropriate AI service                           │  │
│  │  3. Process and extract metadata                              │  │
│  │  4. Update DynamoDB with results                              │  │
│  └────────────┬───────────────┬───────────────┬─────────────────┘  │
│               │               │               │                      │
│               │               │               │                      │
│  ┌────────────▼──────┐ ┌──────▼──────┐ ┌─────▼──────────┐         │
│  │   Rekognition     │ │  Textract   │ │  Comprehend    │         │
│  │                   │ │             │ │                │         │
│  │ - Label Detection │ │ - Text      │ │ - Key Phrases  │         │
│  │ - Text Detection  │ │   Extraction│ │ - Entities     │         │
│  │ - Object          │ │ - Document  │ │ - Sentiment    │         │
│  │   Recognition     │ │   Analysis  │ │                │         │
│  └───────────────────┘ └─────────────┘ └────────────────┘         │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Upload Flow

```
User                Frontend            API Gateway         Lambda              S3              EventBridge         AI Lambda           DynamoDB
 │                     │                     │                │                 │                   │                  │                  │
 │  Select File        │                     │                │                 │                   │                  │                  │
 ├────────────────────>│                     │                │                 │                   │                  │                  │
 │                     │                     │                │                 │                   │                  │                  │
 │                     │  POST /files/upload │                │                 │                   │                  │                  │
 │                     ├────────────────────>│                │                 │                   │                  │                  │
 │                     │                     │                │                 │                   │                  │                  │
 │                     │                     │  Invoke Upload │                 │                   │                  │                  │
 │                     │                     ├───────────────>│                 │                   │                  │                  │
 │                     │                     │                │                 │                   │                  │                  │
 │                     │                     │                │  Generate       │                   │                  │                  │
 │                     │                     │                │  Presigned URL  │                   │                  │                  │
 │                     │                     │                ├────────────────>│                   │                  │                  │
 │                     │                     │                │                 │                   │                  │                  │
 │                     │                     │                │  Create Metadata│                   │                  │                  │
 │                     │                     │                ├─────────────────┼───────────────────┼──────────────────┼─────────────────>│
 │                     │                     │                │                 │                   │                  │                  │
 │                     │  Return URL         │                │                 │                   │                  │                  │
 │                     │<────────────────────┼────────────────┤                 │                   │                  │                  │
 │                     │                     │                │                 │                   │                  │                  │
 │                     │  PUT to S3          │                │                 │                   │                  │                  │
 │                     ├─────────────────────┼────────────────┼────────────────>│                   │                  │                  │
 │                     │                     │                │                 │                   │                  │                  │
 │                     │                     │                │                 │  Object Created   │                  │                  │
 │                     │                     │                │                 ├──────────────────>│                  │                  │
 │                     │                     │                │                 │                   │                  │                  │
 │                     │                     │                │                 │                   │  Invoke AI       │                  │
 │                     │                     │                │                 │                   ├─────────────────>│                  │
 │                     │                     │                │                 │                   │                  │                  │
 │                     │                     │                │                 │                   │                  │  Process File    │
 │                     │                     │                │                 │                   │                  │  (Rekognition/   │
 │                     │                     │                │                 │                   │                  │   Textract/      │
 │                     │                     │                │                 │                   │                  │   Comprehend)    │
 │                     │                     │                │                 │                   │                  │                  │
 │                     │                     │                │                 │                   │                  │  Update Metadata │
 │                     │                     │                │                 │                   │                  ├─────────────────>│
 │                     │                     │                │                 │                   │                  │                  │
 │  Upload Complete    │                     │                │                 │                   │                  │                  │
 │<────────────────────┤                     │                │                 │                   │                  │                  │
```

### List Items Flow

```
User            Frontend        API Gateway      Lambda          DynamoDB
 │                 │                 │              │                │
 │  Navigate       │                 │              │                │
 │  to Folder      │                 │              │                │
 ├────────────────>│                 │              │                │
 │                 │                 │              │                │
 │                 │  GET /items     │              │                │
 │                 │  ?parentId=xyz  │              │                │
 │                 ├────────────────>│              │                │
 │                 │                 │              │                │
 │                 │                 │  Invoke      │                │
 │                 │                 ├─────────────>│                │
 │                 │                 │              │                │
 │                 │                 │              │  Query GSI1    │
 │                 │                 │              │  PK=USER#id    │
 │                 │                 │              │  #PARENT#xyz   │
 │                 │                 │              ├───────────────>│
 │                 │                 │              │                │
 │                 │                 │              │  Return Items  │
 │                 │                 │              │<───────────────┤
 │                 │                 │              │                │
 │                 │  Return Items   │              │                │
 │                 │<────────────────┼──────────────┤                │
 │                 │                 │              │                │
 │  Display Files  │                 │              │                │
 │<────────────────┤                 │              │                │
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Layer 1: Network Security                         │     │
│  │  - HTTPS/TLS 1.2+                                  │     │
│  │  - API Gateway with AWS WAF (optional)             │     │
│  │  - VPC endpoints (optional)                        │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Layer 2: Access Control                           │     │
│  │  - Open Access (No Authentication)                 │     │
│  │  - Simplified for demo purposes                    │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Layer 3: Data Security                            │     │
│  │  - S3 encryption at rest (SSE-S3)                  │     │
│  │  - DynamoDB encryption                             │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Layer 4: Monitoring & Audit                       │     │
│  │  - CloudWatch Logs                                 │     │
│  │  - CloudTrail                                      │     │
│  │  - X-Ray tracing                                   │     │
│  └────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────┘
```

## Scalability Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Auto-Scaling Components                     │
│                                                               │
│  API Gateway                                                 │
│  └─> Automatic scaling (no limits)                          │
│                                                               │
│  Lambda Functions                                            │
│  └─> Concurrent executions: 1000 (default)                  │
│      └─> Can scale to 10,000+ with limit increase           │
│                                                               │
│  DynamoDB                                                    │
│  └─> On-demand mode: Automatic scaling                      │
│      └─> Or provisioned with auto-scaling                   │
│                                                               │
│  S3                                                          │
│  └─> Unlimited storage                                      │
│      └─> 5,500 GET/3,500 PUT per second per prefix         │
│                                                               │
│  AI Services                                                 │
│  └─> Managed by AWS, automatic scaling                      │
└───────────────────────────────────────────────────────────────┘
```

## Cost Optimization Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Cost Optimization Strategies                │
│                                                               │
│  S3 Intelligent-Tiering                                      │
│  └─> Automatically moves data to cheaper tiers              │
│                                                               │
│  DynamoDB On-Demand                                          │
│  └─> Pay only for actual usage                              │
│                                                               │
│  Lambda Memory Optimization                                  │
│  └─> API: 512MB, AI: 2048MB                                 │
│                                                               │
│  CloudWatch Log Retention                                    │
│  └─> 7 days (configurable)                                  │
│                                                               │
│  API Gateway Caching                                         │
│  └─> Cache GET requests (optional)                          │
│                                                               │
│  Reserved Concurrency                                        │
│  └─> Prevent runaway Lambda costs                           │
└───────────────────────────────────────────────────────────────┘
```
