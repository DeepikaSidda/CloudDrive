# Smart Cloud Drive 🚀

> A Smart Cloud Drive that turns Amazon S3 into a visual, user-friendly file management system. It enables intelligent search and file discovery by automatically generating previews and metadata for stored content.

You can check out a quick prototype/demo here: https://d1r3w63amk2v4x.cloudfront.net/


## ✨ Features

### Core Functionality
- **File Management**: Upload, download, organize files and folders
- **Smart Search**: AI-powered metadata extraction for easy discovery
- **Multiple Views**: Grid and list view modes
- **Responsive**: Works on desktop, tablet, and mobile

### AI-Powered Intelligence
- **Image Analysis**: Automatic object and scene detection (Amazon Rekognition)
- **Document Processing**: Text extraction from PDFs (Amazon Textract)
- **Text Analysis**: Keyword and entity extraction (Amazon Comprehend)
- **Auto-Tagging**: Automatic labels and keywords for all files

### Technical Excellence
- **Serverless**: Auto-scaling, no server management
- **Cost-Effective**: Pay only for what you use (~$52/month for 10 users)
- **Secure**: Encryption at rest and in transit, IAM policies
- **Monitored**: CloudWatch logs and metrics
- **Fast**: Sub-second API responses, direct S3 uploads

## Key Features Built with Kiro

- Visual file management with thumbnails
- AI-powered metadata extraction
- Folder hierarchy with breadcrumb navigation
- Secret Room with password protection
- Trash/Bin system with restore
- File sharing with expiration
- Bulk operations
- Storage analytics dashboard
- Search functionality

## 🏗️ Architecture

```
User → React Frontend → API Gateway → Lambda → DynamoDB + S3
                                              ↓
                                         EventBridge
                                              ↓
                                         AI Lambda → Rekognition/Textract/Comprehend
```

**Full architecture diagram:** [docs/ARCHITECTURE_DIAGRAM.md](docs/ARCHITECTURE_DIAGRAM.md)
## 📸 App Screenshots Gallery

<p align="center">
  <a href="https://raw.githubusercontent.com/DeepikaSidda/CloudDrive/main/Screenshots/mainpage.png">
    <img src="https://raw.githubusercontent.com/DeepikaSidda/CloudDrive/main/Screenshots/mainpage.png" width="250" />
  </a>
  <a href="https://raw.githubusercontent.com/DeepikaSidda/CloudDrive/main/Screenshots/adahboard.png">
    <img src="https://raw.githubusercontent.com/DeepikaSidda/CloudDrive/main/Screenshots/adahboard.png" width="250" />
  </a>
  <a href="https://raw.githubusercontent.com/DeepikaSidda/CloudDrive/main/Screenshots/s3.png">
    <img src="https://raw.githubusercontent.com/DeepikaSidda/CloudDrive/main/Screenshots/s3.png" width="250" />
  </a>
  <a href="https://raw.githubusercontent.com/DeepikaSidda/CloudDrive/main/Screenshots/tags.png">
    <img src="https://raw.githubusercontentusercontent.com/DeepikaSidda/CloudDrive/main/Screenshots/tags.png" width="250" /> 
  </a>
</p>


## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- AWS CLI configured
- AWS CDK installed: `npm install -g aws-cdk`

### 5-Minute Setup

```bash
# 1. Install all dependencies
cd infrastructure && npm install && cd ..
cd backend/api && npm install && cd ../..
cd backend/ai-processor && npm install && cd ../..
cd frontend && npm install && cd ..

# 2. Deploy infrastructure
cd infrastructure
cdk bootstrap  # First time only
cdk deploy

# 3. Build backend
cd ../backend/api && npm run build && cd ../..
cd backend/ai-processor && npm run build && cd ../..

# 4. Configure frontend
cd frontend
cp .env.example .env
# Edit .env with CDK outputs

# 5. Run!
npm run dev
```



## 🎯 Use Cases

- **Personal Cloud Storage**: Store and organize your files securely
- **Photo Management**: Automatic tagging of photos with AI
- **Document Archive**: Extract text from PDFs for easy searching
- **Team Collaboration**: Share files with team members (Phase 2)
- **Content Management**: Organize media files with AI-generated metadata



## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling

### Backend
- **AWS Lambda** - Serverless compute
- **API Gateway** - REST API
- **DynamoDB** - NoSQL database
- **Amazon S3** - File storage
- **EventBridge** - Event routing

### AI Services
- **Amazon Rekognition** - Image analysis
- **Amazon Textract** - Document processing
- **Amazon Comprehend** - Text analysis

### Infrastructure
- **AWS CDK** - Infrastructure as Code
- **TypeScript** - CDK language
- **CloudFormation** - AWS provisioning

## 📊 Project Structure

```
smart-cloud-drive/
├── infrastructure/              # AWS CDK infrastructure code
│   ├── bin/app.ts              # CDK app entry point
│   ├── lib/cloud-drive-stack.ts # Stack definition
│   └── package.json
│
├── backend/
│   ├── api/                    # API Lambda functions
│   │   ├── src/
│   │   │   ├── upload.ts       # File upload handler
│   │   │   ├── list-items.ts   # List files/folders
│   │   │   ├── create-folder.ts # Create folder
│   │   │   ├── update-item.ts  # Rename/move
│   │   │   ├── delete-item.ts  # Delete files/folders
│   │   │   └── download.ts     # File download
│   │   └── package.json
│   │
│   └── ai-processor/           # AI processing Lambda
│       ├── src/index.ts        # AI analysis handler
│       └── package.json
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── api/               # API client
│   │   ├── App.tsx            # Root component
│   │   └── main.tsx           # Entry point
│   └── package.json
│
└── docs/                       # Documentation
    ├── ARCHITECTURE.md
    ├── API.md
    └── ...
```






---

**Built with ❤️ using Kiro**

⭐ Star this repo if you find it helpful!
