import dgram from 'dgram';
import EventEmitter from 'events';

export interface UdpProxyOptions {
    localPort?: number;
    localAddress?: string;
    remotePort?: number;
    remoteAddress?: string;
    proxyAddress?: string;
    ipv6?: boolean;
    localipv6?: boolean;
    timeout?: number;
}

interface AddressInfo {
    address: string;
    family: FamilyType;
    port: number;
}

interface ListeningDetails {
    local: AddressInfo;
    remote: AddressInfo;
}

interface BoundDetails {
    route: AddressInfo;
    peer: AddressInfo;
}

interface UdpProxySocket extends dgram.Socket {
    timeout?: NodeJS.Timeout;
    peer?: dgram.RemoteInfo;
    bound?: boolean;
}

interface ProxyEvents {
    listening: (details: ListeningDetails) => void;
    error: (error: Error | unknown) => void;
    close: (peer?: dgram.RemoteInfo) => void;
    bound: (details: BoundDetails) => void;
    incomingMessage: (message: Buffer, remoteInfo: dgram.RemoteInfo, peer: dgram.RemoteInfo) => void;
    outgoingMessage: (message: Buffer, remoteInfo: dgram.RemoteInfo) => void;
}

declare interface UdpProxy {
    on<U extends keyof ProxyEvents>(event: U, listener: ProxyEvents[U]): this;
    emit<U extends keyof ProxyEvents>(event: U, ...args: Parameters<ProxyEvents[U]>): boolean;
}

type UdpType = 'udp4' | 'udp6';
type FamilyType = 'IPv4' | 'IPv6';
type Transform = (msg: Buffer, rinfo: dgram.RemoteInfo) => Buffer;

class UdpProxy extends EventEmitter {
    private localPort: number;
    private localAddress: string;
    private localUdpType: UdpType;
    private localFamily: FamilyType;
    public remotePort: number;
    public remoteAddress: string;
    private remoteUdpType: UdpType;
    private remoteFamily: FamilyType;
    private proxyAddress: string;
    private timeout: number;

    public server: UdpProxySocket = null;
    public client: UdpProxySocket = null;

    private incomingTransforms: Transform[];
    private outgoingTransforms: Transform[];

    public get remoteDetails(): AddressInfo {
        return {
            address: this.remoteAddress,
            family: this.remoteFamily,
            port: this.remotePort
        }
    }

    public get localDetails(): AddressInfo {
        return {
            address: this.localAddress,
            family: this.localFamily,
            port: this.localPort
        }
    }

    public get peerDetails(): AddressInfo {
        return {
            address: this.client?.peer?.address,
            family: this.client?.peer?.family,
            port: this.client?.peer?.port
        }
    }

    constructor(options?: UdpProxyOptions) {
        super();
        this.localPort = options?.localPort || 0;
        this.localAddress = options?.localAddress || '0.0.0.0';
        this.localUdpType = options?.localipv6 ? 'udp6' : 'udp4';
        this.localFamily = options?.localipv6 ? 'IPv6' : 'IPv4';
        this.remotePort = options?.remotePort || 0;
        this.remoteAddress = options?.remoteAddress || 'localhost';
        this.remoteUdpType = options?.ipv6 ? 'udp6' : 'udp4';
        this.remoteFamily = options?.ipv6 ? 'IPv6' : 'IPv4';
        this.proxyAddress = options?.proxyAddress || '0.0.0.0';
        this.timeout = options?.timeout || 10000;

        this.incomingTransforms = [];
        this.outgoingTransforms = [];

        this.initializeServer();
    }

    public send = (socket: UdpProxySocket, msg: Buffer, address: string, port: number): Promise<number> => {
        return new Promise((resolve, reject) => {
            socket.send(msg, 0, msg.length, port, address, (error, bytes) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(bytes);
                }
            })
        })
    }

    public addIncomingTransform = (transform: Transform): void => {
        this.incomingTransforms.push(transform);
    }

    public addOutgoingTransform = (transform: Transform): void => {
        this.outgoingTransforms.push(transform);
    }

    private initializeServer = () => {
        this.server = dgram.createSocket(this.localUdpType);

        this.server.on('listening', () => {
            setImmediate(() => {
                const details: ListeningDetails = { 
                    local: this.localDetails,
                    remote: this.remoteDetails
                }
                this.emit('listening', details);
            })
        });

        this.server.on('message', (msg, rinfo) => {
            if(!this.client) {
                this.client = this.createClient(msg, rinfo);
            } else {
                this.client.emit('send', msg, rinfo);
            }
        });

        this.server.on('error', (err) => {
            this.server.close();
            this.emit('error', err);
        });

        this.server.on('close', () => {
            this.emit('close');
        });

        this.server.bind(this.localPort, this.localAddress);
    }

    private createClient = (msg: Buffer, rinfo: dgram.RemoteInfo): UdpProxySocket => {
        const client = dgram.createSocket(this.remoteUdpType) as UdpProxySocket;
        
        client.once('listening', () => {
            client.peer = rinfo;
            const details: BoundDetails = {
                route: client.address() as AddressInfo,
                peer: {
                    address: rinfo.address,
                    family: rinfo.family,
                    port: rinfo.port
                }
            }
            this.emit('bound', details);
            client.emit('send', msg, rinfo);
        });

        client.on('message', async (msg, rinfo) => {
            try {
                const message = this.processIncomingMessage(msg, rinfo);
                await this.send(this.server, message, client.peer.address, client.peer.port);
                this.emit('incomingMessage', msg, rinfo, client.peer);
            } catch(error) {
                this.emit('error', error);
            }
        });

        client.on('close', () => {
            this.emit('close', client.peer);
            client.removeAllListeners();
            delete this.client;
            this.client = null;
        });

        client.on('send', async (msg, rinfo) => {
            try {
                const message = this.processOutgoingMessage(msg, rinfo);
                await this.send(client, message, this.remoteAddress, this.remotePort);
                this.emit('outgoingMessage', msg, rinfo);
                /*if(!client.timeout) {
                    client.timeout = setTimeout(() => {
                        client.close();
                    }, this.timeout);
                }*/
            } catch(error) {
                this.emit('error', error);
            }
        });

        client.bind(0, this.proxyAddress);

        return client;
    }

    private processIncomingMessage = (msg: Buffer, rinfo: dgram.RemoteInfo): Buffer => {
        let result = msg;
        for(const transform of this.incomingTransforms) {
            result = transform(result, rinfo);
        }
        return result;
    }

    private processOutgoingMessage = (msg: Buffer, rinfo: dgram.RemoteInfo): Buffer => {
        let result = msg;
        for(const transform of this.outgoingTransforms) {
            result = transform(result, rinfo);
        }
        return result;
    }
}

export default UdpProxy;