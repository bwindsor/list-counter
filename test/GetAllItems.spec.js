var GetAllItems = require('../lambda/GetAllItems.js').GetAllItems;
var PutItem = require('../lambda/PutItem.js').PutItem;
var mocha = require('mocha');
var ClearTable = require('./ClearTable').ClearTable;
var assert = require('assert');

describe('GetAllItems', () => {
    it('gets all the items', async () => {
        await ClearTable();  // Make sure DB is empty 
        var expectedData = [
            {
                name: 'TestItem1',
                count: 0
            },
            {
                name: 'TestItem2',
                count: 7
            },
            {
                name: 'TestItem3',
                count: 2
            }
        ];
        await Promise.all(expectedData.map(d => PutItem(d.name, d.count)));
        var actualData = await GetAllItems();
        actualData.sort((a,b) => a.name.localeCompare(b.name));
        await ClearTable();
        assert.deepEqual(actualData, expectedData);
    }).timeout(6000);
});
