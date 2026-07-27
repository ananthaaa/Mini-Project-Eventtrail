# EventTrail / CampusPulse — Backend Infrastructure (`/infra`)

This directory houses the AWS Serverless Infrastructure as Code (CDK) definitions, backend Lambda function handlers, and database seeding scripts for EventTrail / CampusPulse.

## Target Architecture
- **API Gateway**: REST API endpoints with Cognito JWT authorization.
- **AWS Lambda**: Serverless compute handlers for read APIs, admin CRUD, RSVP/waitlist transactions, and roster reporting.
- **Amazon DynamoDB**: 7 core tables (`Users`, `Clubs`, `Events`, `Venues`, `Speakers`, `PathNodes`, `PathEdges`) with Global Secondary Indexes (GSIs).
- **Amazon Cognito**: User Pool with `student` and `admin` user groups.
- **Amazon S3 & CloudFront**: Media storage for venue maps and event flyers with presigned upload URLs.
- **Amazon SNS & SES / EventBridge**: Transactional email notifications and scheduled event reminders.

## Structure
- `/scripts`: Bulk DynamoDB seeding scripts and utility helpers.
- *(Additional CDK stacks and Lambda function folders will be added starting in Module 1)*.
