/**
 * Akriva Frontend Stack
 *
 * Deploys the SvelteKit frontend as:
 * - Lambda function with Lambda Web Adapter for SSR
 * - S3 bucket for static assets
 * - CloudFront distribution for CDN + custom domain
 * - Route53 A record for DNS
 * - ACM certificate (us-east-1) for HTTPS
 */

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigwv2integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as path from "path";

const LAMBDA_WEB_ADAPTER_ACCOUNT = "753240598075";
const LAMBDA_WEB_ADAPTER_LAYER_VERSION = "22";

export interface FrontendStackProps extends cdk.StackProps {
  readonly stackPrefix: string;
  readonly environment: string;
  readonly domainName: string;
  readonly hostedZoneId: string;
  readonly hostedZoneName: string;
}

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const {
      stackPrefix,
      environment,
      domainName,
      hostedZoneId,
      hostedZoneName,
    } = props;

    // ========================================
    // ROUTE 53 HOSTED ZONE
    // ========================================

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        hostedZoneId,
        zoneName: hostedZoneName,
      },
    );

    // ========================================
    // ACM CERTIFICATE (us-east-1 for CloudFront)
    // ========================================

    // DnsValidatedCertificate creates the cert in us-east-1 via a custom
    // resource, which is required for CloudFront distributions.
    const certificate = new acm.DnsValidatedCertificate(this, "Certificate", {
      domainName,
      hostedZone,
      region: "us-east-1",
    });

    // ========================================
    // S3 BUCKET (static assets)
    // ========================================

    const assetsBucket = new s3.Bucket(this, "AssetsBucket", {
      bucketName: `${stackPrefix.toLowerCase()}-frontend-assets-${environment}`,
      removalPolicy:
        environment === "production"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: environment !== "production",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // ========================================
    // LAMBDA FUNCTION (SSR with Web Adapter)
    // ========================================

    const lambdaWebAdapterLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "LambdaWebAdapter",
      `arn:aws:lambda:${this.region}:${LAMBDA_WEB_ADAPTER_ACCOUNT}:layer:LambdaAdapterLayerX86:${LAMBDA_WEB_ADAPTER_LAYER_VERSION}`,
    );

    const ssrFunction = new lambda.Function(this, "SsrFunction", {
      functionName: `${stackPrefix.toLowerCase()}-frontend-ssr`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "run.sh",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../build")),
      layers: [lambdaWebAdapterLayer],
      environment: {
        PORT: "8080",
        ORIGIN: `https://${domainName}`,
        AWS_LAMBDA_EXEC_WRAPPER: "/opt/bootstrap",
        NODE_ENV: "production",
      },
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      architecture: lambda.Architecture.X86_64,
      description: "SvelteKit SSR handler for Akriva frontend",
    });

    // ========================================
    // API GATEWAY V2 (HTTP API)
    // ========================================
    // Using API Gateway V2 instead of Lambda Function URL because
    // Lambda Function URL rejects SvelteKit's form action query strings
    // (e.g. ?/signin) with InvalidQueryStringException.

    const httpApi = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: `${stackPrefix.toLowerCase()}-frontend-api`,
      description: "HTTP API for SvelteKit SSR frontend",
    });

    const lambdaIntegration =
      new apigwv2integrations.HttpLambdaIntegration(
        "SsrIntegration",
        ssrFunction,
      );

    httpApi.addRoutes({
      path: "/{proxy+}",
      methods: [apigwv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    httpApi.addRoutes({
      path: "/",
      methods: [apigwv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    // Extract hostname from API Gateway URL
    // URL format: https://<id>.execute-api.<region>.amazonaws.com
    const apiDomain = `${httpApi.httpApiId}.execute-api.${this.region}.amazonaws.com`;

    // ========================================
    // CLOUDFRONT DISTRIBUTION
    // ========================================

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      comment: `${stackPrefix} Frontend (${environment})`,
      defaultBehavior: {
        origin: new origins.HttpOrigin(apiDomain, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
        }),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy:
          cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      },
      additionalBehaviors: {
        "/_app/*": {
          origin:
            origins.S3BucketOrigin.withOriginAccessControl(assetsBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
      },
      domainNames: [domainName],
      certificate,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });

    // ========================================
    // ROUTE 53 RECORD
    // ========================================

    new route53.ARecord(this, "AliasRecord", {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(
        new route53targets.CloudFrontTarget(distribution),
      ),
    });

    // ========================================
    // S3 DEPLOYMENT (static assets)
    // ========================================

    new s3deploy.BucketDeployment(this, "DeployStaticAssets", {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, "../../build/client")),
      ],
      destinationBucket: assetsBucket,
      distribution,
      distributionPaths: ["/_app/*"],
      cacheControl: [
        s3deploy.CacheControl.maxAge(cdk.Duration.days(365)),
        s3deploy.CacheControl.setPublic(),
      ],
    });

    // ========================================
    // OUTPUTS
    // ========================================

    new cdk.CfnOutput(this, "SiteUrl", {
      value: `https://${domainName}`,
      description: "Frontend URL",
    });

    new cdk.CfnOutput(this, "DistributionId", {
      value: distribution.distributionId,
      description: "CloudFront distribution ID",
    });

    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: distribution.distributionDomainName,
      description: "CloudFront distribution domain name",
    });

    new cdk.CfnOutput(this, "AssetsBucketName", {
      value: assetsBucket.bucketName,
      description: "S3 bucket for static assets",
    });

    new cdk.CfnOutput(this, "HttpApiUrl", {
      value: httpApi.apiEndpoint,
      description: "API Gateway HTTP API URL for SSR",
    });
  }
}
