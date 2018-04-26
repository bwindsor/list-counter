// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

async function GetAllItems() {
    
    // Create the DynamoDB service object
    var ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});
    
    var params = {
        TableName: process.env.DB_TABLE_NAME.trim(),
    };
    
    return new Promise((resolve, reject) => {
        ddb.scan(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.Items.map(d => {
                    return {
                        name: d.ItemName.S,
                        count: Number.parseInt(d.ItemCount.N)
                    }
                }));
            }
        })
    });

}

// Lambda wrapper
async function handler(event, context) {
    var data = await GetAllItems();
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": JSON.stringify(data),
        "isBase64Encoded": false
    };
}  

module.exports = {
    GetAllItems: GetAllItems,
    handler: handler
}