import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export interface ApiStackProps extends cdk.StackProps {
  readonly envName?: string;
  readonly httpApi: apigwv2.CfnApi;
  readonly jwtAuthorizer: apigwv2.CfnAuthorizer;
  readonly mediaBucket: s3.Bucket;
  readonly mediaDomain: string;
  readonly eventsTable: dynamodb.Table;
  readonly clubsTable: dynamodb.Table;
  readonly venuesTable: dynamodb.Table;
  readonly speakersTable: dynamodb.Table;
  readonly pathNodesTable: dynamodb.Table;
  readonly pathEdgesTable: dynamodb.Table;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const envName = props.envName || 'dev';

    // Lambda Functions

    const listEventsLambda = new lambda.Function(this, 'ListEventsFunction', {
      functionName: `EventTrail-ListEvents-${envName}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api/events/listEvents')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(10),
      environment: {
        EVENTS_TABLE_NAME: props.eventsTable.tableName,
      },
    });
    props.eventsTable.grantReadData(listEventsLambda);

    const getEventLambda = new lambda.Function(this, 'GetEventFunction', {
      functionName: `EventTrail-GetEvent-${envName}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api/events/getEvent')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(5),
      environment: {
        EVENTS_TABLE_NAME: props.eventsTable.tableName,
      },
    });
    props.eventsTable.grantReadData(getEventLambda);

    const listClubsLambda = new lambda.Function(this, 'ListClubsFunction', {
      functionName: `EventTrail-ListClubs-${envName}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api/clubs/listClubs')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(10),
      environment: {
        CLUBS_TABLE_NAME: props.clubsTable.tableName,
      },
    });
    props.clubsTable.grantReadData(listClubsLambda);

    const getClubLambda = new lambda.Function(this, 'GetClubFunction', {
      functionName: `EventTrail-GetClub-${envName}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api/clubs/getClub')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(5),
      environment: {
        CLUBS_TABLE_NAME: props.clubsTable.tableName,
      },
    });
    props.clubsTable.grantReadData(getClubLambda);

    const listVenuesLambda = new lambda.Function(this, 'ListVenuesFunction', {
      functionName: `EventTrail-ListVenues-${envName}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api/venues/listVenues')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(10),
      environment: {
        VENUES_TABLE_NAME: props.venuesTable.tableName,
      },
    });
    props.venuesTable.grantReadData(listVenuesLambda);

    const getVenueLambda = new lambda.Function(this, 'GetVenueFunction', {
      functionName: `EventTrail-GetVenue-${envName}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api/venues/getVenue')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(5),
      environment: {
        VENUES_TABLE_NAME: props.venuesTable.tableName,
      },
    });
    props.venuesTable.grantReadData(getVenueLambda);

    const listSpeakersLambda = new lambda.Function(this, 'ListSpeakersFunction', {
      functionName: `EventTrail-ListSpeakers-${envName}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api/speakers/listSpeakers')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(10),
      environment: {
        SPEAKERS_TABLE_NAME: props.speakersTable.tableName,
      },
    });
    props.speakersTable.grantReadData(listSpeakersLambda);

    const getPathNodesLambda = new lambda.Function(this, 'GetPathNodesFunction', {
      functionName: `EventTrail-GetPathNodes-${envName}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api/graph/getPathNodes')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(10),
      environment: {
        PATH_NODES_TABLE_NAME: props.pathNodesTable.tableName,
      },
    });
    props.pathNodesTable.grantReadData(getPathNodesLambda);

    const getPathEdgesLambda = new lambda.Function(this, 'GetPathEdgesFunction', {
      functionName: `EventTrail-GetPathEdges-${envName}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api/graph/getPathEdges')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(10),
      environment: {
        PATH_EDGES_TABLE_NAME: props.pathEdgesTable.tableName,
      },
    });
    props.pathEdgesTable.grantReadData(getPathEdgesLambda);

    // Module 4: Admin CRUD & Media Upload Lambdas
    
    const getUploadUrlLambda = new lambda.Function(this, 'GetUploadUrlFunction', {
      functionName: `EventTrail-GetUploadUrl-${envName}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api/media/getUploadUrl')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(5),
      environment: {
        MEDIA_BUCKET_NAME: props.mediaBucket.bucketName,
        MEDIA_DOMAIN: props.mediaDomain,
      },
    });
    props.mediaBucket.grantPut(getUploadUrlLambda);

    const createEventLambda = new lambda.Function(this, 'CreateEventFunction', {
      functionName: `EventTrail-CreateEvent-${envName}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api/events/createEvent')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(10),
      environment: {
        EVENTS_TABLE_NAME: props.eventsTable.tableName,
      },
    });
    props.eventsTable.grantReadWriteData(createEventLambda);

    const updateEventLambda = new lambda.Function(this, 'UpdateEventFunction', {
      functionName: `EventTrail-UpdateEvent-${envName}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api/events/updateEvent')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(10),
      environment: {
        EVENTS_TABLE_NAME: props.eventsTable.tableName,
      },
    });
    props.eventsTable.grantReadWriteData(updateEventLambda);

    const deleteEventLambda = new lambda.Function(this, 'DeleteEventFunction', {
      functionName: `EventTrail-DeleteEvent-${envName}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api/events/deleteEvent')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(10),
      environment: {
        EVENTS_TABLE_NAME: props.eventsTable.tableName,
      },
    });
    props.eventsTable.grantReadWriteData(deleteEventLambda);

    const createVenueLambda = new lambda.Function(this, 'CreateVenueFunction', {
      functionName: `EventTrail-CreateVenue-${envName}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api/venues/createVenue')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(10),
      environment: {
        VENUES_TABLE_NAME: props.venuesTable.tableName,
      },
    });
    props.venuesTable.grantReadWriteData(createVenueLambda);

    // API Gateway Integrations and Routes

    const addRoute = (routeKey: string, lambdaFn: lambda.Function) => {
      const integration = new apigwv2.CfnIntegration(this, `${lambdaFn.node.id}Integration`, {
        apiId: props.httpApi.ref,
        integrationType: 'AWS_PROXY',
        integrationUri: lambdaFn.functionArn,
        payloadFormatVersion: '2.0',
      });

      new apigwv2.CfnRoute(this, `${lambdaFn.node.id}Route`, {
        apiId: props.httpApi.ref,
        routeKey: routeKey,
        target: `integrations/${integration.ref}`,
      });

      // Grant API Gateway permission to invoke the Lambda function
      lambdaFn.addPermission(`${lambdaFn.node.id}Invoke`, {
        principal: new cdk.aws_iam.ServicePrincipal('apigateway.amazonaws.com'),
        sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${props.httpApi.ref}/*/*`,
      });
    };

    const addAuthRoute = (routeKey: string, lambdaFn: lambda.Function) => {
      const integration = new apigwv2.CfnIntegration(this, `${lambdaFn.node.id}Integration`, {
        apiId: props.httpApi.ref,
        integrationType: 'AWS_PROXY',
        integrationUri: lambdaFn.functionArn,
        payloadFormatVersion: '2.0',
      });

      new apigwv2.CfnRoute(this, `${lambdaFn.node.id}Route`, {
        apiId: props.httpApi.ref,
        routeKey: routeKey,
        target: `integrations/${integration.ref}`,
        authorizationType: 'JWT',
        authorizerId: props.jwtAuthorizer.ref,
      });

      lambdaFn.addPermission(`${lambdaFn.node.id}Invoke`, {
        principal: new cdk.aws_iam.ServicePrincipal('apigateway.amazonaws.com'),
        sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${props.httpApi.ref}/*/*`,
      });
    };

    addRoute('GET /events', listEventsLambda);
    addRoute('GET /events/{id}', getEventLambda);
    addRoute('GET /clubs', listClubsLambda);
    addRoute('GET /clubs/{id}', getClubLambda);
    addRoute('GET /venues', listVenuesLambda);
    addRoute('GET /venues/{id}', getVenueLambda);

    addRoute('GET /speakers', listSpeakersLambda);
    addRoute('GET /graph/nodes', getPathNodesLambda);
    addRoute('GET /graph/edges', getPathEdgesLambda);

    // Protected Routes
    addAuthRoute('POST /events', createEventLambda);
    addAuthRoute('PUT /events/{id}', updateEventLambda);
    addAuthRoute('DELETE /events/{id}', deleteEventLambda);
    addAuthRoute('POST /venues', createVenueLambda);
    addAuthRoute('GET /upload-url', getUploadUrlLambda);
  }
}
