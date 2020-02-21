/**
 * Asynchronous Queue
 */
class AsyncQueue {
    constructor() {
        this._queue = [];
        this._waitingPopTasks = [];
    }

    /**
     * Push item to queue
     * @param {*} item 
     */
    push(item) {
        this._queue.push(item);

        if (!this._waitingPopTasks.length) return;

        let { resolve, min, limit } = this._waitingPopTasks[0];

        if (this._queue.length >= min) {
            this._waitingPopTasks.shift();
            resolve(this._get(limit));
        }
    }

    _get(limit) {
        let end = limit !== -1 ? limit : this._queue.length;
        let messages = [...this._queue.slice(0, end)];
        this._queue = this._queue.splice(0, end);
        
        return messages;
    }

    /**
     * Asynchronous pop items from queue.
     * This function is waiting for the queue has at least `min` items before `pop`
     * 
     * @param {Number} timeOut time in millisecond for waiting
     * @param {Number} min the minimum items require for pop
     * @param {Number} limit limit items to pop
     * @return {Promise<Array>} array of items. The number of items is between `min` and `limit` if on time else 0
     */
    pop(timeOut = undefined, min = 1, limit = -1) {
        return new Promise(resolve => {
            if (this._queue.length >= min) {
                resolve(this._get(limit));
            } else {
                this._waitingPopTasks.push({ resolve, min, limit });
                if (timeOut !== undefined) {
                    setTimeout(() => resolve([]), timeOut);
                }
            }
        })
    }

    pushBack(messages){
        this.queue.unshift(...messages);
    }
}

/**
 * Map string-AsyncQueue class
 */
class AsyncQueueMap {
    constructor() {
        this._queues = {};
    }

    /**
     * push item to AsynchronousQueue map by `key`
     * @param {string} key key of AsynchronousQueue
     * @param {*} item 
     */
    push(key, item) {
        // console.log("TCL: AsyncQueueMap -> push -> this._queues", this._queues)    
        let queue = this._getQueue(key);
        queue.push(item);
    }

    /**
     * get `AsyncQueue` of key
     * @param {string} key 
     * @return {AsyncQueue} AsyncQueue of `key`
     */
    _getQueue(key) {
        let queue = this._queues[key] = this._queues[key] || new AsyncQueue();
        return queue;
    }

    /**
     * Asynchronous pop items from queue.
     * This function is waiting for the queue has at least `min` items before `pop`
     * @param {Number} timeOut time in millisecond for waiting
     * @param {Number} min the minimum items require for pop
     * @param {Number} limit limit items to pop
     * @return {Promise<Array>} array of items. The number of items is between `min` and `limit` if on time else 0
     */
    async pop(key, timeOut = undefined, min = 1, limit = -1) {
        let queue = this._getQueue(key);
        let messages = await queue.pop(timeOut, min, limit);

        if(!queue.length){
            //xóa các queue rỗng để giải phóng bộ nhớ
            delete this._queues[key];
        }
        return messages;
    }

    pushBack(key, messages){
        this._getQueue(key)
            .pushBack(messages);
    }
}

module.exports = {
    AsyncQueue,
    AsyncQueueMap,
}