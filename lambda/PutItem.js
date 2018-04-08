// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

// Creates a new item, or replaces an old item with a new item.
async function PutItem(itemName, itemCount) {

    // Create the DynamoDB service object
    var ddb = new AWS.DynamoDB({ apiVersion: '2012-10-08' });

    var params = {
        TableName: process.env.DB_TABLE_NAME,
        Item: {
            'ItemName': { S: itemName },
            'ItemCount': { N: itemCount.toString() }
        }
    };

    // Call DynamoDB to add the item to the table
    return new Promise((resolve, reject) => {
        ddb.putItem(params, function (err, data) {
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
    return await PutItem(event.name, event.count);
}  

module.exports = {
    PutItem: PutItem,
    handler: handler
}