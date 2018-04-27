var { execSync } = require('child_process');

var stdout = execSync('terraform output -json', { timeout: 10000 });
var x = JSON.parse(stdout)

module.exports = {
  api_base: x.api_base.value,
  aws_region: x.aws_region.value,
  db_table_name: x.db_table_name.value,
  website_endpoint: x.website_endpoint.value
}