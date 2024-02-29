import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam'

export class DeployStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const instanceType = ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO);
    const dbName = "mornington_development";

    // Create database master user secret and store it in Secrets Manager
    const masterUserSecret = new secretsmanager.Secret(this, "mornington-secrets", {
      secretName: "mornington-db-master-user-secret",
      description: "Database master user credentials",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "postgres" }),
        generateStringKey: "password",
        passwordLength: 16,
        excludePunctuation: true,
      },
    });

    const vpc = new ec2.Vpc(this, 'MorningtonVpc', {
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        {
          cidrMask: 24,
          name: 'PrivateWithEgress',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // Create a Security Group
    const sg = new ec2.SecurityGroup(this, "MorningtonDbSg", {
      securityGroupName: "mornington-db-sg",
      vpc,
    });

    const port = 5432;

    // Add Inbound rule
    sg.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(port),
      `Allow port ${port} for database connection from only within the VPC (${vpc.vpcId})`
    );

    // create RDS instance (PostgreSQL)
    const dbInstance = new rds.DatabaseInstance(this, "MorningtonDb", {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      instanceType,
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16_1 }),
      port,
      securityGroups: [sg],
      databaseName: dbName,
      credentials: rds.Credentials.fromSecret(masterUserSecret),
      backupRetention: cdk.Duration.days(0), // disable automatic DB snapshot retention
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      allowMajorVersionUpgrade: true,
      autoMinorVersionUpgrade: true
    });

    // const cluster = new rds.DatabaseCluster(this, 'Database', {
    //   engine: rds.DatabaseClusterEngine.auroraPostgres({
    //     version: rds.AuroraPostgresEngineVersion.VER_15_4,
    //   }),
    //   // writer: rds.ClusterInstance.provisioned('writer'),
    //   vpc,
    // });
    
    const dbProxy = new rds.DatabaseProxy(this, 'Proxy', {
      proxyTarget: rds.ProxyTarget.fromInstance(dbInstance),
      secrets: [dbInstance.secret!],
      securityGroups: [sg],
      vpc,
      requireTLS: false,
      vpcSubnets: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }),
    });
    

    // // DB connection settings will be appended to this secret (host, port, etc.)
    // masterUserSecret.attach(dbInstance);



    // TODO: How to access RDS
    const codeAsset = lambda.AssetCode.fromAsset('../simple', {
      bundling: {
        image: lambda.Runtime.NODEJS_20_X.bundlingImage,
        command: [
          'bash', '-c', 
          `
            export npm_config_cache=/tmp/.npm &&
            npm install &&
            npm run build &&
            cp -au node_modules /asset-output &&
            cp -au build/* /asset-output
          `,
        ]
      },
    });

    const role = new iam.Role(this, 'MorningtonLambdaRole', {
      roleName: 'mornington-lambda-role',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    })
    
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ssm:GetParameter', 'secretsmanager:GetSecretValue', 'kms:Decrypt'],
        resources: ['*'],
      }),
    )

    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
        resources: ['*'],
      }),
    )

    // The code that defines your stack goes here
    const handler = new lambda.Function(this, 'MorningtonApiService', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'src/lambdaServer.handler',
      code: codeAsset,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      environment: {
        // TODO: Add AWS_REGION
        RDS_SECRET_NAME: dbInstance.secret!.secretName,

        DB_ENDPOINT_ADDRESS: dbInstance.dbInstanceEndpointAddress,
        DB_NAME: dbName,
        DB_SECRET_ARN: dbInstance.secret!.secretFullArn!,
      },
      role
    });

    const api = new apigateway.RestApi(this, "mornington-api", {
      restApiName: "Mornington Service",
      description: "This service serves widgets."
    });

    const integration = new apigateway.LambdaIntegration(handler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

    api.root.addMethod("GET", integration); // GET /

    dbInstance.connections.allowFrom(handler, ec2.Port.tcp(port))
  }
}
