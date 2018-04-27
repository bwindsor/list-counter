/* Bucket for storing deployment state */
terraform {
  backend "s3" {
    bucket = "how-many-dan-stories-terraform-state"
    key    = "terraform-state"
    region = "us-east-1"
  }
}

/*** Variables ***/
/* For AWS deployment */
provider "aws" {
    profile = "${var.profile}"
    region = "${var.aws_region}"
}
variable "aws_region" {
    description = "AWS region to launch servers."
    default = "us-east-1"
}
variable "profile" {
    description = "Credentials profile to use."
}
variable "deployment_title" {
    description = "Name for this deployment"
}
locals {
    deployment_name = "${var.deployment_title}-${terraform.workspace}"
    api_description = "Specification for API for list counter ${local.deployment_name}"
}

/* S3 bucket for frontend */
resource "aws_s3_bucket" "website" {
    bucket = "${lower(local.deployment_name)}-website"
    acl    = "public-read"
    policy = ""

    website {
        index_document = "index.html"
        error_document = "error.html"
    }
}

/* Frontend */
resource "aws_s3_bucket_object" "homepage" {
  bucket = "${aws_s3_bucket.website.id}"
  acl    = "public-read"
  content_type = "text/html"
  key    = "index.html"
  source = "../client/dist/index.html"
  etag   = "${md5(file("../client/dist/index.html"))}"
}
resource "aws_s3_bucket_object" "stylesheet" {
  bucket = "${aws_s3_bucket.website.id}"
  acl    = "public-read"
  content_type = "text/css"
  key    = "style.css"
  source = "../client/dist/style.css"
  etag   = "${md5(file("../client/dist/style.css"))}"
}
resource "aws_s3_bucket_object" "bundle" {
  bucket = "${aws_s3_bucket.website.id}"
  acl    = "public-read"
  content_type = "application/javascript"
  key    = "bundle.js"
  source = "../client/dist/bundle.js"
  etag   = "${md5(file("../client/dist/bundle.js"))}"
}
resource "aws_s3_bucket_object" "environment" {
  bucket = "${aws_s3_bucket.website.id}"
  acl    = "public-read"
  content_type = "application/javascript"
  key    = "environment.js"
  content = "${data.template_file.js-environment.rendered}"
}
data "template_file" "js-environment" {
    template = "${file("environment.js")}"

    vars {
        api_base = "${aws_api_gateway_deployment.list-counter-deployment.invoke_url}"
    }
}
resource "aws_s3_bucket_object" "sourcemap" {
  bucket = "${aws_s3_bucket.website.id}"
  acl    = "public-read"
  key    = "bundle.js.map"
  source = "../client/dist/bundle.js.map"
  etag   = "${md5(file("../client/dist/bundle.js.map"))}"
}

/* DynamoDB Database */
resource "aws_dynamodb_table" "main-table" {
    name           = "${local.deployment_name}-main-table"
    read_capacity  = 5
    write_capacity = 5
    hash_key       = "ItemName"

    attribute {
        name = "ItemName"
        type = "S"
    }
}

/*** Lambda functions ***/

/* Zip files to be uploaded for lambda functions */
data "archive_file" "distribute_lambda_putItem" {
    type        = "zip"
    output_path = "${path.module}/artifacts/distribute_lambda_putItem.zip"
    source_file = "${path.module}/lambda/PutItem.js"
}
data "archive_file" "distribute_lambda_getAllItems" {
    type        = "zip"
    output_path = "${path.module}/artifacts/distribute_lambda_getAllItems.zip"
    source_file = "${path.module}/lambda/GetAllItems.js"
}
data "archive_file" "lambda_db_backup" {
    type        = "zip"
    output_path = "${path.module}/artifacts/lambda_db_backup.zip"
    source_file = "${path.module}/lambda/BackupDb.js"
}

/* Get strings and counts */
resource "aws_lambda_function" "getAllItems" {
    filename         = "${data.archive_file.distribute_lambda_getAllItems.output_path}"
    function_name    = "${local.deployment_name}-get-all-items"
    role             = "${aws_iam_role.iam_for_lambda.arn}"
    handler          = "GetAllItems.handler"
    source_code_hash = "${base64sha256(file("${data.archive_file.distribute_lambda_getAllItems.output_path}"))}"
    runtime          = "nodejs8.10"
    timeout          = 5
    memory_size      = 128
    description      = "Gets all items from the database"
    environment {
        variables = {
            DB_TABLE_NAME = "${aws_dynamodb_table.main-table.id}"   
        }
    }
}

/* Create or update item */
resource "aws_lambda_function" "putItem" {
    filename         = "${data.archive_file.distribute_lambda_putItem.output_path}"
    function_name    = "${local.deployment_name}-put-item"
    role             = "${aws_iam_role.iam_for_lambda.arn}"
    handler          = "PutItem.handler"
    source_code_hash = "${base64sha256(file("${data.archive_file.distribute_lambda_putItem.output_path}"))}"
    runtime          = "nodejs8.10"
    timeout          = 5
    memory_size      = 128
    description      = "Adds or updates an item in the database"
    environment {
        variables = {
            DB_TABLE_NAME = "${aws_dynamodb_table.main-table.id}"   
        }
    }
}

/* Backup DB */
resource "aws_lambda_function" "backupDb" {
    filename         = "${data.archive_file.lambda_db_backup.output_path}"
    function_name    = "${local.deployment_name}-db_backup"
    role             = "${aws_iam_role.iam_for_lambda.arn}"
    handler          = "BackupDb.handler"
    source_code_hash = "${base64sha256(file("${data.archive_file.lambda_db_backup.output_path}"))}"
    runtime          = "nodejs8.10"
    timeout          = 10
    memory_size      = 128
    description      = "Creates a database backup"
    environment {
        variables = {
            DB_TABLE_NAME = "${aws_dynamodb_table.main-table.id}"   
        }
    }
}

/* Lambda execution role */
resource "aws_iam_role" "iam_for_lambda" {
  name = "${local.deployment_name}-lambda-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": ["lambda.amazonaws.com"]
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

/* Policy attached to lambda execution role to allow logging */
resource "aws_iam_role_policy" "lambda_log_policy" {
  name = "${local.deployment_name}-lambda_log_policy"
  role = "${aws_iam_role.iam_for_lambda.id}"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams",
                "logs:PutLogEvents",
                "logs:GetLogEvents",
                "logs:FilterLogEvents"
            ],
            "Resource": "*"
        }
    ]
}
EOF
}

/* Policy attached to lambda execution role to allow access to dynamodb */
resource "aws_iam_role_policy" "lambda_dynamodb_access_policy" {
  name = "${local.deployment_name}-lambda_dynamodb_access_policy"
  role = "${aws_iam_role.iam_for_lambda.id}"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:BatchGetItem",
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:Scan",
                "dynamodb:Query",
                "dynamodb:CreateBackup"
            ],
            "Resource": "${aws_dynamodb_table.main-table.arn}"
        }
    ]
}
EOF
}

/*** API gateway ***/
/* Main API spec */
resource "aws_api_gateway_rest_api" "list-counter-api" {
    name        = "${local.deployment_name} API"
    description = "${local.api_description}"
    body        = "${data.template_file.api-spec.rendered}"
}

resource "aws_api_gateway_deployment" "list-counter-deployment" {
    depends_on = ["data.template_file.api-spec"]

    rest_api_id = "${aws_api_gateway_rest_api.list-counter-api.id}"
    stage_name  = "prod"
}

data "template_file" "api-spec" {
    template = "${file("api_spec.json")}"

    vars {
        api_description = "${local.api_description}"
        deployment_name = "${local.deployment_name}"
        access_control_allow_origin = "${terraform.workspace == "production" ? "http://${aws_s3_bucket.website.website_endpoint}" : "*"}"
        lambda_put_item_invoke_uri = "${aws_lambda_function.putItem.invoke_arn}"
        lambda_get_all_invoke_uri = "${aws_lambda_function.getAllItems.invoke_arn}"
        lambda_exec_role_arn = "${aws_iam_role.iam_for_api_gateway.arn}"
    }
}

/* API execution role */
resource "aws_iam_role" "iam_for_api_gateway" {
  name = "${local.deployment_name}-api-gateway-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": ["apigateway.amazonaws.com"]
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

/* Policy attached to lambda execution role to allow execution of lambda */
resource "aws_iam_role_policy" "api_gateway_execute_lambda_policy" {
    name = "${local.deployment_name}-execute-lambda-policy"
    role = "${aws_iam_role.iam_for_api_gateway.id}"

    policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Resource": "*"
        }
    ]
}
EOF
}

/* Throttle limits - set quite low since it should be low use */
resource "aws_api_gateway_method_settings" "api_throttle_setting" {
  rest_api_id = "${aws_api_gateway_rest_api.list-counter-api.id}"
  stage_name  = "${aws_api_gateway_deployment.list-counter-deployment.stage_name}"
  method_path = "*/*"

  settings {
    throttling_burst_limit = 10
    throttling_rate_limit = 20
    
    metrics_enabled = true
    logging_level   = "INFO"

  }
}

/* Permission on lambda's end to allow API gateway to invoke it */
resource "aws_lambda_permission" "allow_api_gateway" {
    statement_id   = "${local.deployment_name}-AllowExecutionFromAPIGateway"
    action         = "lambda:InvokeFunction"
    function_name  = "${aws_lambda_function.getAllItems.function_name}"
    principal      = "apigateway.amazonaws.com"
    source_arn     = "${aws_api_gateway_deployment.list-counter-deployment.execution_arn}"
}


/* Global account config for api writing to cloudwatch */
resource "aws_api_gateway_account" "global_api_role" {
  cloudwatch_role_arn = "${aws_iam_role.cloudwatch.arn}"
}

/* This is used by api gateway to write to cloudwatch */
resource "aws_iam_role" "cloudwatch" {
  name = "api_gateway_cloudwatch_global"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "apigateway.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

/* Role allowing API gateway to use write logs */
resource "aws_iam_role_policy" "cloudwatch" {
  name = "global_api_cloudwatch_role"
  role = "${aws_iam_role.cloudwatch.id}"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams",
                "logs:PutLogEvents",
                "logs:GetLogEvents",
                "logs:FilterLogEvents"
            ],
            "Resource": "*"
        }
    ]
}
EOF
}

/* Alarm for high usage */
resource "aws_cloudwatch_metric_alarm" "high-api-usage" {
  alarm_name                = "${local.deployment_name}-api-high-usage"
  comparison_operator       = "GreaterThanOrEqualToThreshold"
  evaluation_periods        = "1"
  metric_name               = "Count"
  namespace                 = "AWS/ApiGateway"
  period                    = "300"
  statistic                 = "Sum"
  threshold                 = "100"
  alarm_description         = "Too many API requests"
  alarm_actions             = ["${aws_sns_topic.api_cloudwatch_notifications.arn}"]

  dimensions {
      ApiName = "${aws_api_gateway_rest_api.list-counter-api.name}"
  }
}

resource "aws_sns_topic" "api_cloudwatch_notifications" {
  name = "${local.deployment_name}_cloudwatch_notifications"
}
/*
Email is unsupported - configure the subscription manually.
resource "aws_sns_topic_subscription" "xxxx_cloudwatch_notifications" {
    topic_arn = "${aws_sns_topic.xxxx_cloudwatch_notifications.arn}"
    protocol  = "email"
    endpoint  = "email@gmail.com"
}
*/


/*** Backups ***/
/* Cloudwatch role which is allowed to trigger lambda */
resource "aws_iam_role" "iam_for_cloudwatch" {
  name = "${local.deployment_name}-cloudwatch-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": ["events.amazonaws.com"]
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

/* Policy attached to cloudwatch execution role to allow lambda execution on db backup function */
resource "aws_iam_role_policy" "cloudwatch_execute_policy" {
  name = "${local.deployment_name}-cloudwatch_execute_policy"
  role = "${aws_iam_role.iam_for_cloudwatch.id}"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Resource": "${aws_lambda_function.backupDb.arn}"
        }
    ]
}
EOF
}

/* Trigger to run the backup */
resource "aws_cloudwatch_event_rule" "run-backup" {
  name        = "${local.deployment_name}-run_backup"
  description = "Run backup of DB"
  /* 1st of the month at 3am */
  schedule_expression = "cron(0 3 1 * ? *)"
  role_arn = "${aws_iam_role.iam_for_cloudwatch.arn}"
  is_enabled = true
}

resource "aws_cloudwatch_event_target" "run-backup-target" {
  rule      = "${aws_cloudwatch_event_rule.run-backup.name}"
  target_id = "${local.deployment_name}-db-backup-cloudwatch-event-target"
  arn       = "${aws_lambda_function.backupDb.arn}"
  input     = "{}"
}

/* Permission on lambda's end to allow cloudwatch to invoke it */
resource "aws_lambda_permission" "allow_cloudwatch_db_backup" {
  statement_id   = "${local.deployment_name}-AllowExecutionFromCloudWatch"
  action         = "lambda:InvokeFunction"
  function_name  = "${aws_lambda_function.backupDb.function_name}"
  principal      = "events.amazonaws.com"
  source_arn     = "${aws_cloudwatch_event_rule.run-backup.arn}"
}


/* Output the URL to find the API at */
output "website_endpoint" {
    value = "${aws_s3_bucket.website.website_endpoint}"
}

output "aws_region" {
    value = "${var.aws_region}"
}
output "db_table_name" {
    value = "${aws_dynamodb_table.main-table.id}"
}
output "api_base" {
    value = "${aws_api_gateway_deployment.list-counter-deployment.invoke_url}"
}