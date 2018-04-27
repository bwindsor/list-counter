var PutItem = require('../lambda/PutItem.js').PutItem;
var IncrementItem = require('../lambda/IncrementItem.js').IncrementItem;
var mocha = require('mocha');
var ClearTable = require('./ClearTable').ClearTable;
const env = require('./TerraformOutput')
var assert = require('assert');

describe('IncrementItem', () => {
    it('increments an item', async () => {
        await PutItem(env.db_table_name, 'TestItem', 0);
        var p = [];
        for (var i = 0; i < 50; i++) {
            p.push(IncrementItem(env.db_table_name, 'TestItem'));
        }
        await Promise.all(p);
        var data = await IncrementItem(env.db_table_name, 'TestItem');
        assert.equal(data.Attributes.ItemCount.N, '51');
        await ClearTable();
    });
});