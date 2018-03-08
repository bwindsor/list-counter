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
variable "aws_region" {
    description = "AWS region to launch servers."
    default = "us-east-1"
}
variable "profile" {
    description = "Credentials profile to use."
}
variable "deployment_name" {
    description = "Name for this deployment"
    default = "production"
}

/* S3 bucket for frontend */

/* S3 bucket for DB snapshots */

/* DynamoDB Database */


/*** Lambda functions ***/
/* Get numbers and counts */
/* Create item */
/* Set a count */
/* DB backup */

/*** API gateway ***/
resource "aws_api_gateway_rest_api" "list-counter-api" {
    name        = "list-counter-api-gateway-${vars.deployment_name}"
    description = "API for list counter"
    body        = 
}

data "template_file" "api-spec" {
    template = "${file("api_spec.json")}"

    vars {
        deployment_name = "${vars.deployment_name}"
    }
}