var PutItem = require('../lambda/PutItem.js').PutItem;
var mocha = require('mocha');
var ClearTable = require('./ClearTable').ClearTable;
const env = require('./TerraformOutput')

describe('PutItem', () => {
    it('puts a new item', async () => {
        await PutItem(env.db_table_name, 'TestItem', 0);
        await ClearTable();
    });
    it('updates an existing item', async () => {
        await PutItem(env.db_table_name, 'TestItem', 3);
        await PutItem(env.db_table_name, 'TestItem', 4);
        await ClearTable();
    });
});