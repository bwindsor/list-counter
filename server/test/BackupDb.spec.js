const BackupDb = require('../lambda/BackupDb.js').BackupDb;
const env = require('./TerraformOutput');
const mocha = require('mocha');
const DeleteBackup = require('./DeleteBackup').DeleteBackup;

describe('BackupDb', () => {

    it('backs up without error', async () => {
        var data = await BackupDb(env.db_table_name);
        var arn = data.BackupDetails.BackupArn;
        await DeleteBackup(arn);
    }).timeout(5000);
});

