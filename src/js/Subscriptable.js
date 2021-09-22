
export default class Subscriptable {

    /**
     * Construcs Subscriptable object
     */
    constructor() {
        this.dispatch = this.dispatch.bind(this);
        this.subscribe = this.subscribe.bind(this);
        this.unSubscribe = this.unSubscribe.bind(this);

        this.events = {};
    }

    /**
     * Dispatches specified event with data to all subscripted handlers
     * 
     * @param {string} event 
     * @param {any} data 
     */
    dispatch(event, data) {
        let handlersArray = this.events[event];
        if (!handlersArray) return;
        for (let handler of handlersArray) {
            handler(data);
        }
    }

    /**
     * @callback eventHandler
     * @param {any} data event data
     * @returns {void}
     */

    /**
     * Subscribes handler to a specified event
     * 
     * @param {string} event 
     * @param {eventHandler} handler
     */
    subscribe(event, handler) {
        let handlersArray = this.events[event];
        if (!handlersArray) {
            this.events[event] = [handler];
            return;
        }
        if (handlersArray.includes(handler)) return;
        handlersArray.push(handler);
    }

    /**
     * Unsubscribes handler from a specified event
     *
     * @param {string} event
     * @param {eventHandler} handler
     * 
     * @throws Error if handler wasn't previously subscribed
     */
    unSubscribe(event, handler) {
        let handlersArray = this.events[event];
        if (!handlersArray) throw new Error("handler does not present");
        if (!handlersArray.includes(handler)) throw new Error("handler does not present");
        this.events[event].splice(handlersArray.indexOf(handler), 1);
    }

}
