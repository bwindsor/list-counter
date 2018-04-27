var AWS = require('aws-sdk');

async function DeleteBackup(arn) {
    var ddb = new AWS.DynamoDB({ apiVersion: '2012-10-08' });
    var params = {
        BackupArn: arn /* required */
    };
    return new Promise((resolve, reject) => {
        ddb.deleteBackup(params, (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        });
    })

}

module.exports = {
    DeleteBackup: DeleteBackup
}