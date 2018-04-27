// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

// Adds 1 to the count property of an item.
async function IncrementItem(tableName, itemName) {

    // Create the DynamoDB service object
    var ddb = new AWS.DynamoDB({ apiVersion: '2012-10-08' });

    var params = {
        Key: {
            'ItemName': {
                S: itemName
            },
        },
        TableName: tableName,
        AttributeUpdates: {
            'ItemCount': {
                Action: 'ADD',
                Value: {
                    N: '1'
                }
            }
        },
        ReturnValues: 'UPDATED_NEW'
    };

    // Call DynamoDB to update the table
    return new Promise((resolve, reject) => {
        ddb.updateItem(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

// Lambda wrapper
async function handler(event, context) {
    var input = JSON.parse(event.body);
    var data = await IncrementItem(process.env.DB_TABLE_NAME.trim(), input.name);

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*"
        },
        "body": JSON.stringify({count: parseInt(data.Attributes.ItemCount.N)}),
        "isBase64Encoded": false
    };
}

module.exports = {
    IncrementItem: IncrementItem,
    handler: handler
}