let EventEmitter = require('events');
let { AsyncQueueMap } = require('./async-queues');
const bodyParser = require('body-parser');

const defaultOptions = {
    middlewares: [],
    listenTimeOut: 15 * 1000,
    retry: true,
    rejectWhenError: false
}


class Server extends EventEmitter {

    /**
     * create Server constructor
     * @param {Express} app express application
     * @param {*} uri 
     * @param {*} options 
     */
    constructor(app, uri, options = {}) {
        super();
        options = { ...defaultOptions, ...options }
        let { middlewares } = options;
        this._uri = uri;
        this._options = options;
        this._mapQueues = new AsyncQueueMap();

        this._setBodyParseMiddleware(app);
        app.get(`${uri}/listen/:id`, ...middlewares, (req, res) => this._clientListen(req, res));
        app.post(`${uri}/send/:id`, ...middlewares, (req, res) => this._clientSend(req, res));

        this.on('error', () => { });
    }

    _getAllMiddlewareNames(app) {
        let appStack = (app._router && app._router.stack) || app.stack || [];
        return appStack.map(m => m.handle.name || '<anonymous function>')
    }

    _setBodyParseMiddleware(app) {
        let middlewares = this._getAllMiddlewareNames(app);

        if (!middlewares.some(name => name === 'jsonParser'))
            app.use(bodyParser.json());

        if (!middlewares.some(name => name === 'urlencodedParser'))
            app.use(bodyParser.urlencoded({ extended: true }));
    }

    _clientSend(req, res) {
        let id = req.params.id;
        let body = (typeof req.body === 'string') ? JSON.parse(req.body) : req.body;

        this.emit('message', body.message, id);
        res.send('OK');
    }

    async _clientListen(req, res) {
        try {
            let id = req.params.id;
            let listenTimeOut = parseInt(req.query.timeout) || this._options.listenTimeOut;
            let packages = await this._mapQueues.pop(id, listenTimeOut);
            let messages = packages.map(({ message }) => message);

            try {
                res.send({ data: { messages } });
                packages.forEach(({ message, resolve }) =>
                    this.emit('sent', message, id) && resolve())

            } catch (err) {
                if (this._options.retry) {
                    this._mapQueues.pushBack(packages);
                    this.emit('retry', packages);
                } else {
                    err.packages = packages;
                    this.emit('error', err);
                }
                if (this._options.rejectWhenError)
                    packages.forEach(({ reject }) => reject(err));
            }
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * send message to client
     * @param {string} id client Id
     * @param {*} message message
     * @return {Promise}
     */
    send(id, message) {
        return new Promise((resolve, reject) => {
            if(!id ){
                let err = new Error(`'id' is invalid`)
                reject(err);
                this.emit('error', err);
            }

            if(!message ){
                let err = new Error(`'message' is invalid`)
                reject(err);
                this.emit('error', err);
            }
            
            this._mapQueues.push(id, { message, resolve, reject });
        })
    }
}

module.exports = Server;