const EventEmitter = require('events');
const crypto = require("crypto");
const axios = require('axios');

const defaultOptions = {
    listenTimeOut: 15000,
    headers: {
        'Content-Type': 'application/json'
    },
    liveWhenError: true,
}

class Client extends EventEmitter {
    constructor(uri, options = {}) {
        super();
        options = { ...defaultOptions, ...options };
        let { listenTimeOut, liveWhenError, ...axiosOptions } = options;
        this.uri = uri;

        this.listenTimeOut = listenTimeOut;
        this.liveWhenError = liveWhenError;
        this.id = options.id || this.generatorId();
        this.sendUri = `${this.uri}/send/${this.id}`;
        this.receiveUri = `${this.uri}/listen/${this.id}?timeout=${this.listenTimeOut}`;
        this.axios = axios.create(axiosOptions);


        this.loopReceive();
        if (this.liveWhenError)
            this.on('error', () => { });

        // console.log("TCL: Client -> constructor -> axios", this.axios)    
    };

    async loopReceive() {
        while (true) {
            console.log('client listening at', this.receiveUri);
            await this.axios.get(this.receiveUri)
                .then(res => res.data.data.messages || [])
                .then(messages => messages && messages.forEach(
                    message => this.emit('message', message)
                ))
                .catch(err => this.emit('error', err))
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