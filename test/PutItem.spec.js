var PutItem = require('../lambda/PutItem.js').PutItem;
var mocha = require('mocha');
var ClearTable = require('./ClearTable').ClearTable;

describe('PutItem', () => {
    it('puts a new item', async () => {
        await PutItem('TestItem', 0);
        await ClearTable();
    });
    it('updates an existing item', async () => {
        await PutItem('TestItem', 3);
        await PutItem('TestItem', 4);
        await ClearTable();
    });
});