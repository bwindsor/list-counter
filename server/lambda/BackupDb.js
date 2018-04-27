// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

async function BackupDb(tableName) {

    // Create the DynamoDB service object
    var ddb = new AWS.DynamoDB({ apiVersion: '2012-10-08' });

    var params = {
        TableName: tableName.trim(),
        BackupName: tableName.trim() + '_' + (new Date()).toISOString().split(':').join('')
    };

    return new Promise((resolve, reject) => {
        ddb.createBackup(params, function (err, data) {
            if (err) {
                reject(err)
            } else {
                resolve(data);           // successful response
            }
        });
    });

}

// Lambda wrapper
async function handler(event, context) {
    await BackupDb(process.env.DB_TABLE_NAME);
}

module.exports = {
    handler: handler,
    BackupDb: BackupDb
}
