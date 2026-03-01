#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/frontend.stack";

const app = new cdk.App();

const stackPrefix =
  process.env.STACK_PREFIX || app.node.tryGetContext("stackPrefix");
const region = process.env.AWS_REGION || app.node.tryGetContext("region");
const account =
  process.env.CDK_DEFAULT_ACCOUNT || app.node.tryGetContext("account");
const environment = process.env.ENVIRONMENT || "dev";

new FrontendStack(app, `${stackPrefix}FrontendStack`, {
  env: { account, region },
  stackPrefix,
  environment,
  domainName: process.env.APP_DOMAIN_NAME!,
  hostedZoneId: process.env.HOSTED_ZONE_ID!,
  hostedZoneName: process.env.HOSTED_ZONE_NAME!,
  tags: {
    Application: "Akriva-Frontend",
    Environment: environment,
    ManagedBy: "CDK",
  },
  description: "Akriva frontend (SvelteKit SSR on Lambda + CloudFront)",
});

app.synth();
