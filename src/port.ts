import type { ExtractOnceMessage, Messages, OnceMessageProps, OnceMessages, StateMessageProps, StateMessages } from "./types/messages";
import EventEmitter3 from "eventemitter3";
import { isFirefox, portCryptoAlgorithm } from "./consts";
import { Deferred } from "./utils";
import StateManager from "./state";
import { BindableProperty } from "./property";

const extensionId = "ngbhofnofkggjbpkpnogcdfdgjkpmgka";

export default new class Port {
    port?: chrome.runtime.Port;
    firstMessage = true;
    firstState = true;
    disconnected = new BindableProperty(false);
    unavailable = new BindableProperty(false);
    pendingMessages = new Map<string, (response?: any) => void>();
    runtime!: typeof chrome.runtime;
    signKey = Deferred.create<CryptoKey>();
    name?: string;
    events = new EventEmitter3();

    init(name?: string) {
        this.name = name;

        if(typeof chrome === "undefined") {
            if(isFirefox) {
                const unavailableTimeout = setTimeout(() => {
                    this.unavailable.value = true;
                }, 1000);

                window.addEventListener("message", (e) => {
                    if(e.data?.source !== "gimloader-in") return;
                    if(e.data?.type === "portDisconnected") {
                        this.firstMessage = true;
                        this.disconnected.value = true;
                        return;
                    }
    
                    this.onMessage(e.data);

                    clearTimeout(unavailableTimeout);
                    this.unavailable.value = false;
                });
    
                window.postMessage({ source: "gimloader-out", json: '{"type": "ready"}' });
            } else {
                this.unavailable.value = true;
            }
        } else {
            if(!isFirefox && !chrome.runtime) return;
            this.runtime = chrome.runtime;

            if(location.hostname === "www.gimkit.com") {
                // @ts-expect-error prevent scripts from using the apis
                chrome.runtime = {};
            }

            this.connectPort();
            this.keepBackgroundAlive();
        }
    }

    connectPort() {
        this.firstMessage = true;

        if(isFirefox) {
            this.port = this.runtime.connect({ name: this.name });
        } else {
            this.port = this.runtime.connect(extensionId, { name: this.name });
        }

        this.port.onMessage.addListener(this.onMessage.bind(this));

        this.port.onDisconnect.addListener(() => {
            this.disconnected.value = true;

            if(this.runtime.lastError) {
                // extension is likely removed entirely (if reinstalled we can reconnect)
                setTimeout(() => this.connectPort(), 1000);
            } else {
                this.connectPort();
            }
        });
    }

    async postMessage(type: string, message: any, returnId?: string) {
        // just discard messages sent while disconnected, we'll resynchronize to before they mattered
        if(this.disconnected.value) return;

        if(typeof chrome !== "undefined") {
            this.port?.postMessage({ type, message, returnId, source: "gimloader-out" });
            return;
        }

        // disclaimer: I know nothing about cryptography
        const str = JSON.stringify({ type, message, returnId });

        // generate a signature for the json
        const arr = new TextEncoder().encode(str);
        const key = await this.signKey;
        const signed = await crypto.subtle.sign(portCryptoAlgorithm, key, arr);
        const signature = Array.from(new Uint8Array(signed));

        window.postMessage({ json: str, signature, source: "gimloader-out" });
    }

    onMessage(data: any) {
        this.disconnected.value = false;

        if(data?.type === "key") {
            crypto.subtle.importKey("jwk", data.key, portCryptoAlgorithm, true, ["sign", "verify"])
                .then((key) => this.signKey.resolve(key));
            return;
        }

        // the first message will contain the state, others will contain updates to it
        if(this.firstMessage) {
            if(this.firstState) {
                this.firstState = false;
                StateManager.init(data, {
                    downloadDependencies: (deps) => this.sendAndRecieve("downloadDependencies", deps),
                    broadcast: (type, props) => this.send(type, props)
                });
            } else {
                StateManager.update(data);
            }

            this.firstMessage = false;
            return;
        }

        if(data.returnId) {
            const { response, returnId } = data;
            const callback = this.pendingMessages.get(returnId);
            if(!callback) return;

            callback(response);
            this.pendingMessages.delete(returnId);
        } else {
            StateManager.handle(data.type, data.message, true);
            this.events.emit(data.type, data.message);
        }
    }

    send<Channel extends StateMessages["type"]>(type: Channel, message: StateMessageProps<Channel>) {
        this.postMessage(type, message);
    }

    sendAndRecieve<Channel extends OnceMessages["channel"]>(type: Channel, message: OnceMessageProps<Channel>) {
        return new Promise<ExtractOnceMessage<Channel>["response"]>((res) => {
            const returnId = crypto.randomUUID();
            this.pendingMessages.set(returnId, res);
            this.postMessage(type, message, returnId);
        });
    }

    keepBackgroundAlive() {
        // send a message every 20 seconds
        setInterval(() => {
            if(isFirefox) {
                this.runtime.sendMessage("ping");
            } else {
                this.runtime.sendMessage(extensionId, "ping");
            }
        }, 20000);
    }

    on<Channel extends Messages["type"]>(channel: Channel, callback: (value: Extract<Messages, { type: Channel }>["props"]) => void) {
        return this.events.on(channel, callback);
    }
}();
