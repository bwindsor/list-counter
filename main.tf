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

    cors_rule {
        allowed_headers = ["*"]
        allowed_methods = ["PUT", "POST"]
        allowed_origins = ["https://s3-website-test.hashicorp.com"]
        expose_headers  = ["ETag"]
        max_age_seconds = 3000
    }
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
                "dynamodb:Query"
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
    rest_api_id = "${aws_api_gateway_rest_api.list-counter-api.id}"
    stage_name  = "prod"
}

data "template_file" "api-spec" {
    template = "${file("api_spec.json")}"

    vars {
        api_description = "${local.api_description}"
        deployment_name = "${local.deployment_name}"
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

/* Permission on lambda's end to allow API gateway to invoke it */
resource "aws_lambda_permission" "allow_api_gateway" {
    statement_id   = "${local.deployment_name}-AllowExecutionFromAPIGateway"
    action         = "lambda:InvokeFunction"
    function_name  = "${aws_lambda_function.getAllItems.function_name}"
    principal      = "apigateway.amazonaws.com"
    source_arn     = "${aws_api_gateway_deployment.list-counter-deployment.execution_arn}"
}

/* Set API throttle at quite a low rate since it won't be used that much */
resource "aws_api_gateway_usage_plan" "api_usage_plan" {
  name         = "${local.deployment_name}-usage-plan"
  description  = "Usage plan for ${local.deployment_name} API"
  
  api_stages {
    api_id = "${aws_api_gateway_rest_api.list-counter-api.id}"
    stage  = "${aws_api_gateway_deployment.list-counter-deployment.stage_name}"
  }

  throttle_settings {
    burst_limit = 5
    rate_limit  = 10
  }
}

/* Output the URL to find the API at */
output "api_base" {
    value = "${aws_api_gateway_deployment.list-counter-deployment.invoke_url}"
}
