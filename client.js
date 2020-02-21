const EventEmitter = require('events');
const crypto = require("crypto");
const axios = require('axios');

const defaultOptions = {
    listenTimeOut: 15000,
    headers: {
        'Content-Type': 'application/json'
    },
    liveWhenError: true,
    delayWhenDisconnected:200
}

class Client extends EventEmitter {
    constructor(uri, options = {}) {
        super();
        options = { ...defaultOptions, ...options };
        let { listenTimeOut, liveWhenError, delayWhenDisconnected,...axiosOptions } = options;
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

    _delay(millis) {
        return new Promise(res=>setTimeout(res, millis));
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

    getId() {
        return this.id;
    }

    send(message) {
        return axios.post(this.sendUri, { message })
            // .then(res =>res.json())
            .then(res => this.emit('sent', res) && res)
            .catch(err => this.emit('error', err));
    }

    generatorId() {
        return crypto.randomBytes(16).toString("hex");
    }
}

module.exports = Client;