// these two types you probably want to keep in a separate file, shared between client and server
//export type MessageType = "heartbeat" | "connected";

/* 
Copyright 2018 Arthur Carabott

Permission is hereby granted, free of charge, to any person obtaining a copy of 
this software and associated documentation files (the "Software"), to deal in 
the Software without restriction, including without limitation the rights to 
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of 
the Software, and to permit persons to whom the Software is furnished to do so, 
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all 
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS 
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR 
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER 
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN 
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// the rest of this is for this file

export interface IMessage<T_type extends string, T_data> {
    type: T_type;
    data: T_data;
}

interface ITimestampedMessage<T_type extends string, T_data> extends IMessage<T_type, T_data> {
    timestamp_ms: number;
}

interface IHeartbeatMessage extends IMessage<"Heartbeats", undefined>{
    type: "Heartbeats";
}

export class StayAliveSocket {
    public isDebugEnabled: boolean;

    protected serverUrl: string;
    protected socket?: WebSocket;
    protected isConnectionDesired: boolean;
    protected heartbeatIntervalId: number;
    protected heartbeatInterval_ms: number;
    protected reconnectDuration_ms: number;
    protected _isConnecting: boolean;
    protected nextMessageId: number;

    constructor(serverUrl: string) {
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
    public openConnection() {
        this._isConnecting = true;
        this.isConnectionDesired = true;
        this.socket = new WebSocket(this.serverUrl);

        this.socket.onopen = (event) => {
            this._isConnecting = false;
            this.heartbeatIntervalId = window.setInterval(() => {
                const message: IHeartbeatMessage = {type: "Heartbeats", data: undefined};
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

    public closeConnection() {
        this.isConnectionDesired = false;
        if (this.socket !== undefined) {
            this.socket.close();
        }
    }

    public sendMessage<T_type extends string, T_data>(message: IMessage<T_type, T_data>) {
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

        const timestampedMessage: ITimestampedMessage<T_type, T_data> = {
            ...message,
            timestamp_ms: Date.now(),
        };
        const json = JSON.stringify(timestampedMessage);
        this.socket.send(json);

        this.log(`sending ${json}`);
    }

    // overrides
    // -------------------------------------------------------------------------
    public onClose(_event: CloseEvent) {}
    public onError(_event: Event) {}
    public onMessage(_event: MessageEvent) {}
    public onOpen(_event: Event) {}

    // Protected Methods
    // -------------------------------------------------------------------------

    protected reconnect() {
        if (this.socket !== undefined) {
            this.socket.close();
        }

        clearInterval(this.heartbeatIntervalId);
        setTimeout(() => {
            this.openConnection();

            this.log("reconnecting");
        }, this.reconnectDuration_ms);
    }

    protected getNextMessageId() {
        return this.nextMessageId++;
    }

    protected log(message: string) {
        if (this.isDebugEnabled) {
            console.log(message);
        }
    }
}
