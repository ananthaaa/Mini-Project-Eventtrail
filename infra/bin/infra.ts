#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DataLayerStack } from '../lib/data-layer-stack';

const app = new cdk.App();

const envName = app.node.tryGetContext('env') || 'dev';

new DataLayerStack(app, `CampusPulse-DataLayer-${envName}`, {
  envName,
  /* If you wish to deploy to a specific AWS account/region, uncomment and configure below:
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID, 
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1' 
  },
  */
});
