const { Client } = require('./index');
const port = 3000;



async function test() {
    let client = new Client(`http://localhost:${port}/chat`, { listenTimeOut: 4000, });
    client.on('message', message => {
        console.log('client received message', message);
    });
    client.on('error', (err) => { console.log(err.message); });
    while (true) {
        let message = 'conduong xua em di';
        console.log('client sent message:', message);
        await client.send(message);
        await new Promise(resolve => setTimeout(resolve, parseInt(30000 * Math.random())));
    }


}
test();