
export default class Subscriptable {

    constructor() {
        this.dispatch = this.dispatch.bind(this);
        this.subscribe = this.subscribe.bind(this);
        this.unSubscribe = this.unSubscribe.bind(this);

        this.events = {};
    }

    dispatch(event, data) {
        let handlersArray = this.events[event];
        if (!handlersArray) return;
        for (let handler of handlersArray) {
            handler(data);
        }
    }

    subscribe(event, handler) {
        let handlersArray = this.events[event];
        if (!handlersArray) {
            this.events[event] = [handler];
            return;
        }
        if (handlersArray.includes(handler)) return;
        handlersArray.push(handler);
    }

    unSubscribe(event, handler) {
        let handlersArray = this.events[event];
        if (!handlersArray) throw new Error("handler does not present");
        if (handlersArray.includes(handler)) throw new Error("handler does not present");
        this.events[event].splice(handlersArray.indexOf(handler), 1);
    }

}
