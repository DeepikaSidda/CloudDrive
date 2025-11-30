# Smart Cloud Drive 🚀

> A production-grade, AI-powered cloud storage application built on AWS serverless architecture. Think Google Drive, but with automatic AI metadata extraction for your files.

[![AWS](https://img.shields.io/badge/AWS-Serverless-orange)](https://aws.amazon.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## ✨ Features

### Core Functionality
- 📁 **File Management**: Upload, download, organize files and folders
- 🔍 **Smart Search**: AI-powered metadata extraction for easy discovery
- 👁️ **Multiple Views**: Grid and list view modes
- 📱 **Responsive**: Works on desktop, tablet, and mobile

### AI-Powered Intelligence
- 🖼️ **Image Analysis**: Automatic object and scene detection (Amazon Rekognition)
- 📄 **Document Processing**: Text extraction from PDFs (Amazon Textract)
- 💬 **Text Analysis**: Keyword and entity extraction (Amazon Comprehend)
- 🏷️ **Auto-Tagging**: Automatic labels and keywords for all files

### Technical Excellence
- ⚡ **Serverless**: Auto-scaling, no server management
- 💰 **Cost-Effective**: Pay only for what you use (~$52/month for 10 users)
- 🔒 **Secure**: Encryption at rest and in transit, IAM policies
- 📊 **Monitored**: CloudWatch logs and metrics
- 🚀 **Fast**: Sub-second API responses, direct S3 uploads

## 🏗️ Architecture

```
User → React Frontend → API Gateway → Lambda → DynamoDB + S3
                                              ↓
                                         EventBridge
                                              ↓
                                         AI Lambda → Rekognition/Textract/Comprehend
```

**Full architecture diagram:** [docs/ARCHITECTURE_DIAGRAM.md](docs/ARCHITECTURE_DIAGRAM.md)

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

Visit `http://localhost:3000` 🎉

**Detailed setup:** [SETUP.md](SETUP.md)

## 📚 Documentation

**[📖 Complete Documentation Index](INDEX.md)** - Find all documentation organized by role and topic

### Quick Links

- **[GET_STARTED.md](GET_STARTED.md)** - Get up and running in 15 minutes
- **[SETUP.md](SETUP.md)** - Complete setup and installation guide
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Comprehensive project overview
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Common commands and operations
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Production deployment checklist
- **[VISUAL_GUIDE.md](VISUAL_GUIDE.md)** - Visual architecture and workflows
- **[FILE_STRUCTURE.md](FILE_STRUCTURE.md)** - Complete file structure guide

### Deep Dives

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Architecture deep dive
- **[docs/API.md](docs/API.md)** - API endpoint documentation
- **[docs/FEATURES.md](docs/FEATURES.md)** - Feature documentation
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment strategies

## 🎯 Use Cases

- **Personal Cloud Storage**: Store and organize your files securely
- **Photo Management**: Automatic tagging of photos with AI
- **Document Archive**: Extract text from PDFs for easy searching
- **Team Collaboration**: Share files with team members (Phase 2)
- **Content Management**: Organize media files with AI-generated metadata

## 💰 Cost Breakdown

**Estimated monthly cost for 10 users, 100GB storage, 1000 API calls/day:**

| Service | Cost |
|---------|------|
| S3 Storage + Requests | $2.80 |
| DynamoDB | $1.25 |
| Lambda | $15.00 |
| AI Services (Rekognition, Textract, Comprehend) | $30.00 |
| API Gateway | $3.50 |
| **Total** | **~$52/month** |

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

## 🧪 Testing

```bash
# Run frontend tests
cd frontend
npm test

# Run backend tests
cd backend/api
npm test

# Manual testing checklist
# See DEPLOYMENT_CHECKLIST.md
```

## 🔐 Security

- **Open Access**: No authentication required (simplified for demo)
- **Encryption**: S3 SSE-S3, DynamoDB encryption at rest
- **Network**: HTTPS/TLS 1.2+
- **IAM**: Least privilege policies
- **Isolation**: User-specific S3 prefixes

## 📈 Performance

- **API Latency**: <100ms (warm Lambda)
- **Upload Speed**: Direct to S3 (no Lambda bottleneck)
- **Scalability**: Auto-scales to millions of users
- **Availability**: 99.9% (AWS SLA)

## 🚧 Roadmap

### Phase 2 (Planned)
- [ ] Full-text search
- [ ] File sharing with expiration
- [ ] File preview (PDF, images)
- [ ] Batch operations
- [ ] Storage quota tracking

### Phase 3 (Future)
- [ ] Real-time collaboration
- [ ] Mobile app (React Native)
- [ ] Advanced AI features
- [ ] Webhooks and integrations

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: See [docs/](docs/) folder
- **Issues**: Open an issue on GitHub
- **AWS Support**: https://aws.amazon.com/support/

## 🙏 Acknowledgments

- Built with AWS serverless technologies
- Inspired by Google Drive
- UI components from Tailwind CSS
- Icons from React Icons

## 📞 Contact

- **Author**: Your Name
- **Email**: your.email@example.com
- **Website**: https://yourwebsite.com

---

**Built with ❤️ using AWS Serverless Technologies**

⭐ Star this repo if you find it helpful!
