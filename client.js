const EventEmitter = require('events');
const crypto = require("crypto");
const axios = require('axios');

/**
 * The complete Triforce, or one or more components of the Triforce.
 * @typedef {Object & axios.AxiosRequestConfig} Options
 * @property {Number} listenTimeOut - waiting time when create listen request
 * @property {boolean} liveWhenError - client allway live when has error.
 * @property {Number} delayWhenDisconnected - delay time when disconneted before create new request.
 */



const defaultOptions = {
    listenTimeOut: 15000,
    headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive'
    },
    liveWhenError: true,
    delayWhenDisconnected: 200
}

class Client extends EventEmitter {
    /**
     * Create new client 
     * 
     * @param {string} uri uri path for chat
     * @param {Options} options more options
     */
    constructor(uri, options = {}) {
        super();
        options = { ...defaultOptions, ...options };
        let { listenTimeOut, liveWhenError, delayWhenDisconnected, ...axiosOptions } = options;
        this.uri = uri;

        this.listenTimeOut = listenTimeOut;
        this.liveWhenError = liveWhenError;
        this.delayWhenDisconnected = delayWhenDisconnected;

        this.id = options.id || this.generatorId();
        this.sendUri = `${this.uri}/send/${this.id}`;
        this.receiveUri = `${this.uri}/listen/${this.id}?timeout=${this.listenTimeOut}`;
        this.axios = axios.create(axiosOptions);


        this.loopReceive();
        if (this.liveWhenError)
            this.on('error', () => { });

        // console.log("TCL: Client -> constructor -> axios", this.axios)    
    };

    /**
     * Delay in milliseconds
     * 
     * @param {Number} millis 
     */
    _delay(millis) {
        return new Promise(res => setTimeout(res, millis));
    }

    async loopReceive() {
        while (true) {
            try {
                await this.axios.get(this.receiveUri)
                    .then(res => res.data.data.messages || [])
                    .then(messages => messages && messages.forEach(
                        message => this.emit('message', message)
                    ))
            } catch (err) {
                this.emit('error', err);
                await this._delay(this.delayWhenDisconnected);
            }
        }
    }

    /**
     * Client id.
     * 
     * @return {string}
     */
    getId() {
        return this.id;
    }

    /**
     * Send message to server
     * 
     * @param {*} message 
     */
    send(message) {
        return this.axios.post(this.sendUri, { message })
            // .then(res =>res.json())
            .then(res => this.emit('sent', res) && res)
            .catch(err => this.emit('error', err));
    }

    /**
     * Generate id for client.
     * @return {string}
     */
    generatorId() {
        return crypto.randomBytes(16).toString("hex");
    }
}

module.exports = Client;