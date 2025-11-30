#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CloudDriveStack } from '../lib/cloud-drive-stack';

const app = new cdk.App();

new CloudDriveStack(app, 'SmartCloudDriveStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Smart Cloud Drive - AI-powered file storage system',
});

app.synth();
