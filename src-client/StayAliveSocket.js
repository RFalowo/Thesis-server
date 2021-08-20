// these two types you probably want to keep in a separate file, shared between client and server
//export type MessageType = "heartbeat" | "connected";
export class StayAliveSocket {
    constructor(serverUrl) {
        this.serverUrl = serverUrl;
        this.isConnectionDesired = false;
        this.isDebugEnabled = false;
        this._isConnecting = false;
        this.heartbeatInterval_ms = 20 * 1000;
        this.heartbeatIntervalId = -1;
        this.reconnectDuration_ms = 3000;
        this.nextMessageId = 0;
    }
    get isConnecting() {
        return this._isConnecting;
    }
    // Public Methods
    // -------------------------------------------------------------------------
    openConnection() {
        this._isConnecting = true;
        this.isConnectionDesired = true;
        this.socket = new WebSocket(this.serverUrl);
        this.socket.onopen = (event) => {
            this._isConnecting = false;
            this.heartbeatIntervalId = window.setInterval(() => {
                const message = { type: "Heartbeats", data: undefined };
                this.sendMessage(message);
            }, this.heartbeatInterval_ms);
            this.onOpen(event);
        };
        this.socket.onerror = (event) => this.onError(event);
        this.socket.onmessage = (event) => {
            this.onMessage(event);
            this.log(`received: ${event.data}`);
        };
        this.socket.onclose = (event) => {
            this.onClose(event);
            if (this.isConnectionDesired) {
                this.reconnect();
            }
        };
    }
    closeConnection() {
        this.isConnectionDesired = false;
        if (this.socket !== undefined) {
            this.socket.close();
        }
    }
    sendMessage(message) {
        if (this.socket === undefined) {
            throw new Error("Socket is not connected");
        }
        const socketState = this.socket.readyState;
        if (socketState !== this.socket.OPEN) {
            switch (socketState) {
                case this.socket.CONNECTING:
                    throw new Error("Socket is CONNECTING");
                case this.socket.CLOSING:
                    throw new Error("Socket is CLOSING");
                case this.socket.CLOSED:
                    throw new Error("Socket is CLOSED");
                default:
                    throw new Error(`Socket state is ${socketState}`);
            }
        }
        const timestampedMessage = {
            ...message,
            timestamp_ms: Date.now(),
        };
        const json = JSON.stringify(timestampedMessage);
        this.socket.send(json);
        this.log(`sending ${json}`);
    }
    // overrides
    // -------------------------------------------------------------------------
    onClose(_event) { }
    onError(_event) { }
    onMessage(_event) { }
    onOpen(_event) { }
    // Protected Methods
    // -------------------------------------------------------------------------
    reconnect() {
        if (this.socket !== undefined) {
            this.socket.close();
        }
        clearInterval(this.heartbeatIntervalId);
        setTimeout(() => {
            this.openConnection();
            this.log("reconnecting");
        }, this.reconnectDuration_ms);
    }
    getNextMessageId() {
        return this.nextMessageId++;
    }
    log(message) {
        if (this.isDebugEnabled) {
            console.log(message);
        }
    }
}
