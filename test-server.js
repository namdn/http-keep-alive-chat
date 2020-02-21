const express = require('express')
const app = express()
const port = 3000;
const { Server } = require('./index')
const bodyParser = require('body-parser');

// app.use(bodyParser.json()) // handle json data
// app.use(bodyParser.urlencoded({ extended: true })) // handle URL-encoded data


function listMiddleWare(app) {
    var appStack = (app._router && app._router.stack) || app.stack || [];
    return Array.prototype.map.call(appStack, function (middleware, index) {
        return index + '. ' + (middleware.handle.name || '<anonymous function>') + ' ' +
            getFileLine(middleware.handle);
    });
    // force the middleware to produce an error to locate the file.
    function getFileLine(handler) {
        try {
            handler(undefined);
        } catch (e) {
            return e.stack.split('\n')[1];
        }
    }
}

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

console.log(listMiddleWare(app));

const chat = new Server(app, '/chat');

console.log(listMiddleWare(app));


chat.on('message', (message, id) => {
    console.log("client sent:", id, message)
    chat.send(id, message);
})

chat.on('sent', (message, id) => {
    console.log("server sent:", id, message)
})

