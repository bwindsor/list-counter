var PutItem = require('../lambda/PutItem.js').PutItem;
var mocha = require('mocha');
var ClearTable = require('./ClearTable').ClearTable;

describe('PutItem', () => {
    it('puts a new item', RunAndClear(async () => {
        var data = await PutItem('TestItem', 0)
    }))
    it('updates an existing item', RunAndClear(async () => {
        await PutItem('TestItem', 3)
        await PutItem('TestItem', 4)
    }))
});

// fcn accepts done as an argument
function RunAndClear(fcn) {
    return async function () {
        await fcn();
        await ClearTable();
    };
}