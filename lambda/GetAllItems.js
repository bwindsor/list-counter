// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});

var params = {
    TableName: process.env.DYNAMO_TABLE_NAME.trim(),
    Item: {
        'ItemId': {N: '1'},
        'ItemName': {S: 'Test'},
        'ItemCount': {N: '10'}
    }
};

// Call DynamoDB to add the item to the table
ddb.putItem(params, function(err, data) {
    if (err) {
        console.log("Error", err);
    } else {
        console.log("Success", data);
    }
});