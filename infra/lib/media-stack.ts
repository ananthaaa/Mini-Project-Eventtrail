import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export interface MediaStackProps extends cdk.StackProps {
  readonly envName?: string;
}

export class MediaStack extends cdk.Stack {
  public readonly mediaBucket: s3.Bucket;
  public readonly mediaDomain: string;

  constructor(scope: Construct, id: string, props?: MediaStackProps) {
    super(scope, id, props);

    const envName = props?.envName || 'dev';

    // S3 Bucket for Media Uploads - Public Read Access (CloudFront disabled due to AWS limits)
    this.mediaBucket = new s3.Bucket(this, 'MediaBucket', {
      bucketName: `campuspulse-media-${this.account}-${envName}`,
      removalPolicy: envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: envName !== 'prod',
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
      publicReadAccess: true, // Must be true since CloudFront is blocked
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
    });

    this.mediaDomain = this.mediaBucket.bucketRegionalDomainName;

    new cdk.CfnOutput(this, 'MediaBucketName', {
      value: this.mediaBucket.bucketName,
      exportName: `EventTrail-MediaBucketName-${envName}`,
    });

    new cdk.CfnOutput(this, 'MediaDomain', {
      value: this.mediaDomain,
      exportName: `EventTrail-MediaDomain-${envName}`,
    });
  }
}
