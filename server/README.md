## Setup
`SET AWS_PROFILE=<aws profile name>`

`SET AWS_REGION=us-east-1`

`terraform init`

## Integration Testing
`SET AWS_PROFILE=<aws profile name>`
`SET AWS_REGION=us-east-1`

`npm test`

## Deployment
Terraform uses workspaces to have multiple deployments with separately managed states.

This command sets up those workspaces.
`npm run deploy-setup`

This command sets the workspace to test, and then deploys
`npm run deploy-test`

This command sets the workspace to production, and then deploys
`npm run deploy-prod`