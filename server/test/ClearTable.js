// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

async function ClearTable() {
    
    var TABLE_NAME = process.env.DB_TABLE_NAME;
    
    if (TABLE_NAME.toLowerCase().includes('prod')) {
        throw new Error('Table will not be cleared on a table with prod in the name.');
    }
    
    // Create the DynamoDB service object
    var ddb = new AWS.DynamoDB({ apiVersion: '2012-10-08' });

    return new Promise((resolve, reject) => {

        ddb.scan({ TableName: TABLE_NAME }, (err, data) => {
            if (err) {
                reject(err)
            } else {
                var promises = data.Items.map(d => {
                    return new Promise((resolve, reject) => {
                        ddb.deleteItem({ TableName: TABLE_NAME, Key: { "ItemName": d.ItemName } }, (err, data) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(data);
                            }
                        });
                    })
                })
                Promise.all(promises).then(r => resolve()).catch(err => reject(err));
            }
        });
    });

}

module.exports = {
    ClearTable: ClearTable
}