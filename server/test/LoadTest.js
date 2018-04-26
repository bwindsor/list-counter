const fetch = require('node-fetch');

let promises = [];
for (let i = 0; i < 50; i++) {
    promises.push(fetch("https://9se8n3sre0.execute-api.us-east-1.amazonaws.com/prod/item"));
}
Promise.all(promises)
//.then(res => console.log(res.map(r=>r.status)));
.then(res => Promise.all(res.map(r => r.json())))
.then(json => console.log(json));