import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as path from 'path';

export interface AuthStackProps extends cdk.StackProps {
  readonly envName?: string;
  readonly usersTable: dynamodb.Table;
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly httpApi: apigwv2.CfnApi;
  public readonly apiStage: apigwv2.CfnStage;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const envName = props.envName || 'dev';

    // 1. Post-Confirmation Lambda Trigger (must be defined before attaching to UserPool)
    const postConfirmationLambda = new lambda.Function(this, 'PostConfirmationTrigger', {
      functionName: `EventTrail-PostConfirmation-${envName}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/auth/post-confirmation')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(10),
      environment: {
        USERS_TABLE_NAME: props.usersTable.tableName,
      },
    });

    // Grant Lambda permissions to write to Users DynamoDB table
    props.usersTable.grantReadWriteData(postConfirmationLambda);

    // 2. Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'EventTrailUserPool', {
      userPoolName: `EventTrail-UserPool-${envName}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: true, mutable: true },
      },
      customAttributes: {
        role: new cognito.StringAttribute({ mutable: true }),
        clubId: new cognito.StringAttribute({ mutable: true }),
        facultyId: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: false,
        requireUppercase: false,
        requireDigits: false,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      lambdaTriggers: {
        postConfirmation: postConfirmationLambda,
        postAuthentication: postConfirmationLambda,
      },
    });

    // 3. User Pool Groups ('student' and 'admin')
    new cognito.CfnUserPoolGroup(this, 'StudentGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'student',
      description: 'EventTrail Students',
    });

    new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'admin',
      description: 'EventTrail Platform and Club Admins',
    });

    // 4. User Pool App Client
    this.userPoolClient = new cognito.UserPoolClient(this, 'EventTrailAppClient', {
      userPool: this.userPool,
      userPoolClientName: `EventTrail-AppClient-${envName}`,
      authFlows: {
        userSrp: true,
        custom: true,
        userPassword: true,
        adminUserPassword: true,
      },
      preventUserExistenceErrors: true,
    });

    // 5. API Gateway HTTP API for JWT Auth Verification
    this.httpApi = new apigwv2.CfnApi(this, 'HttpApi', {
      name: `EventTrail-HttpApi-${envName}`,
      protocolType: 'HTTP',
      corsConfiguration: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['*'],
      },
    });

    // 6. Cognito JWT Authorizer
    const jwtAuthorizer = new apigwv2.CfnAuthorizer(this, 'JwtAuthorizer', {
      apiId: this.httpApi.ref,
      authorizerType: 'JWT',
      identitySource: ['$request.header.Authorization'],
      name: `CognitoJwtAuthorizer-${envName}`,
      jwtConfiguration: {
        audience: [this.userPoolClient.userPoolClientId],
        issuer: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPool.userPoolId}`,
      },
    });

    // 7. Throwaway '/whoami' Lambda & Route for JWT verification
    const whoamiLambda = new lambda.Function(this, 'WhoAmIFunction', {
      functionName: `EventTrail-WhoAmI-${envName}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/auth/whoami')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(5),
    });

    whoamiLambda.addPermission('ApiGatewayInvoke', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${this.httpApi.ref}/*/*`,
    });

    const whoamiIntegration = new apigwv2.CfnIntegration(this, 'WhoAmIIntegration', {
      apiId: this.httpApi.ref,
      integrationType: 'AWS_PROXY',
      integrationUri: whoamiLambda.functionArn,
      payloadFormatVersion: '2.0',
    });

    new apigwv2.CfnRoute(this, 'WhoAmIRoute', {
      apiId: this.httpApi.ref,
      routeKey: 'GET /whoami',
      authorizationType: 'JWT',
      authorizerId: jwtAuthorizer.ref,
      target: `integrations/${whoamiIntegration.ref}`,
    });

    // 8. API Stage with auto-deploy
    this.apiStage = new apigwv2.CfnStage(this, 'ApiStage', {
      apiId: this.httpApi.ref,
      stageName: '$default',
      autoDeploy: true,
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `EventTrail-UserPoolId-${envName}`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool App Client ID',
      exportName: `EventTrail-UserPoolClientId-${envName}`,
    });

    new cdk.CfnOutput(this, 'HttpApiUrl', {
      value: `https://${this.httpApi.ref}.execute-api.${this.region}.amazonaws.com/`,
      description: 'API Gateway HTTP API Base URL',
      exportName: `EventTrail-HttpApiUrl-${envName}`,
    });
  }
}
