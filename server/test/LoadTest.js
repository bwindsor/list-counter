const fetch = require('node-fetch');
var mocha = require('mocha');
var assert = require('assert');

describe('LoadTest', () => {
    it('complains about too many requests', async () => {
        var API_BASE = process.env.API_BASE;

        let promises = [];
        for (let i = 0; i < 100; i++) {
            promises.push(fetch(API_BASE + "/item"));
        }
        var res = await Promise.all(promises)
        assert.notEqual(res.map(r => r.status).indexOf(429), -1)
    }).timeout(10000);
});