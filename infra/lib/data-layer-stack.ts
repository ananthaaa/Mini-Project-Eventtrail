import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

export interface DataLayerStackProps extends cdk.StackProps {
  /**
   * Deployment environment name (e.g., 'dev', 'staging', 'prod')
   */
  readonly envName?: string;
}

export class DataLayerStack extends cdk.Stack {
  public readonly eventsTable: dynamodb.Table;
  public readonly clubsTable: dynamodb.Table;
  public readonly venuesTable: dynamodb.Table;
  public readonly speakersTable: dynamodb.Table;
  public readonly usersTable: dynamodb.Table;
  public readonly rsvpsTable: dynamodb.Table;
  public readonly pathNodesTable: dynamodb.Table;
  public readonly pathEdgesTable: dynamodb.Table;
  public readonly logGroup: logs.LogGroup;
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly membershipsTable: dynamodb.Table;
  public readonly notificationsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: DataLayerStackProps) {
    super(scope, id, props);

    const envName = props?.envName || 'dev';

    // Base DynamoDB table configuration for serverless/dev efficiency
    const tableProps: Partial<dynamodb.TableProps> = {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: envName === 'prod' },
    };

    // 1. Events Table
    this.eventsTable = new dynamodb.Table(this, 'EventsTable', {
      ...tableProps,
      tableName: `EventTrail-Events-${envName}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      stream: dynamodb.StreamViewType.NEW_IMAGE, // Enables fan-out trigger
    });

    this.eventsTable.addGlobalSecondaryIndex({
      indexName: 'byFaculty',
      partitionKey: { name: 'faculty', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.eventsTable.addGlobalSecondaryIndex({
      indexName: 'byCategory',
      partitionKey: { name: 'category', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.eventsTable.addGlobalSecondaryIndex({
      indexName: 'byOrganizer',
      partitionKey: { name: 'organizerId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 2. Clubs Table
    this.clubsTable = new dynamodb.Table(this, 'ClubsTable', {
      ...tableProps,
      tableName: `EventTrail-Clubs-${envName}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    });

    // 3. Venues Table
    this.venuesTable = new dynamodb.Table(this, 'VenuesTable', {
      ...tableProps,
      tableName: `EventTrail-Venues-${envName}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    });

    // 4. Speakers Table
    this.speakersTable = new dynamodb.Table(this, 'SpeakersTable', {
      ...tableProps,
      tableName: `EventTrail-Speakers-${envName}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    });

    // 5. Users Table
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      ...tableProps,
      tableName: `EventTrail-Users-${envName}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    });

    // 6. RSVPs Table
    this.rsvpsTable = new dynamodb.Table(this, 'RSVPsTable', {
      ...tableProps,
      tableName: `EventTrail-RSVPs-${envName}`,
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
    });

    this.rsvpsTable.addGlobalSecondaryIndex({
      indexName: 'byUser',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 7. Memberships Table
    this.membershipsTable = new dynamodb.Table(this, 'MembershipsTable', {
      ...tableProps,
      tableName: `EventTrail-Memberships-${envName}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // userId
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // clubId
    });

    this.membershipsTable.addGlobalSecondaryIndex({
      indexName: 'ClubMembersIndex',
      partitionKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 8. Notifications Table
    this.notificationsTable = new dynamodb.Table(this, 'NotificationsTable', {
      ...tableProps,
      tableName: `EventTrail-Notifications-${envName}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // userId
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // timestamp#notificationId
    });

    // 7a. PathNodes Table (Walkway Graph Nodes)
    this.pathNodesTable = new dynamodb.Table(this, 'PathNodesTable', {
      ...tableProps,
      tableName: `EventTrail-PathNodes-${envName}`,
      partitionKey: { name: 'nodeId', type: dynamodb.AttributeType.STRING },
    });

    // 7b. PathEdges Table (Walkway Graph Edges)
    this.pathEdgesTable = new dynamodb.Table(this, 'PathEdgesTable', {
      ...tableProps,
      tableName: `EventTrail-PathEdges-${envName}`,
      partitionKey: { name: 'edgeId', type: dynamodb.AttributeType.STRING },
    });

    // 8. CloudWatch Log Group Baseline
    this.logGroup = new logs.LogGroup(this, 'CampusPulseLogGroup', {
      logGroupName: `/aws/campuspulse/${envName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // 9. CloudWatch Dashboard Placeholder
    this.dashboard = new cloudwatch.Dashboard(this, 'CampusPulseDashboard', {
      dashboardName: `CampusPulse-${envName}-Dashboard`,
    });

    this.dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: `# CampusPulse (${envName}) System Metrics\nPlaceholder dashboard initialized in Module 1. Live Lambda and API Gateway metrics will be added in upcoming modules.`,
        width: 24,
        height: 4,
      })
    );

    // Stack Outputs
    new cdk.CfnOutput(this, 'EventsTableName', { value: this.eventsTable.tableName });
    new cdk.CfnOutput(this, 'ClubsTableName', { value: this.clubsTable.tableName });
    new cdk.CfnOutput(this, 'VenuesTableName', { value: this.venuesTable.tableName });
    new cdk.CfnOutput(this, 'SpeakersTableName', { value: this.speakersTable.tableName });
    new cdk.CfnOutput(this, 'UsersTableName', { value: this.usersTable.tableName });
    new cdk.CfnOutput(this, 'RSVPsTableName', { value: this.rsvpsTable.tableName });
    new cdk.CfnOutput(this, 'MembershipsTableName', { value: this.membershipsTable.tableName });
    new cdk.CfnOutput(this, 'NotificationsTableName', { value: this.notificationsTable.tableName });
    new cdk.CfnOutput(this, 'PathNodesTableName', { value: this.pathNodesTable.tableName });
    new cdk.CfnOutput(this, 'PathEdgesTableName', { value: this.pathEdgesTable.tableName });
    new cdk.CfnOutput(this, 'LogGroupName', { value: this.logGroup.logGroupName });
    new cdk.CfnOutput(this, 'DashboardName', { value: this.dashboard.dashboardName });
  }
}
