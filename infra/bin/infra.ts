#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DataLayerStack } from '../lib/data-layer-stack';
import { AuthStack } from '../lib/auth-stack';
import { ApiStack } from '../lib/api-stack';
import { MediaStack } from '../lib/media-stack';

const app = new cdk.App();

const envName = app.node.tryGetContext('env') || 'dev';
const region = process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-south-1';
const account = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID;

const stackProps: cdk.StackProps = {
  env: { account, region },
};

const dataLayer = new DataLayerStack(app, `CampusPulse-DataLayer-${envName}`, {
  ...stackProps,
  envName,
});

const authStack = new AuthStack(app, `CampusPulse-Auth-${envName}`, {
  ...stackProps,
  envName,
  usersTable: dataLayer.usersTable,
});

const mediaStack = new MediaStack(app, `CampusPulse-Media-${envName}`, {
  ...stackProps,
  envName,
});

new ApiStack(app, `CampusPulse-Api-${envName}`, {
  ...stackProps,
  envName,
  httpApi: authStack.httpApi,
  jwtAuthorizer: authStack.jwtAuthorizer,
  mediaBucket: mediaStack.mediaBucket,
  mediaDomain: mediaStack.mediaDomain,
  eventsTable: dataLayer.eventsTable,
  clubsTable: dataLayer.clubsTable,
  venuesTable: dataLayer.venuesTable,
  speakersTable: dataLayer.speakersTable,
  pathNodesTable: dataLayer.pathNodesTable,
  pathEdgesTable: dataLayer.pathEdgesTable,
});
