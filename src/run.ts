import UdpProxy, { UdpProxyOptions } from "./proxy.js";
import { promises as fs } from "fs";
import { join } from "path";
import { combinePackets, Packet, PacketCommand, ServerState, splitPackets } from "./packet.js";
import Inventory from "./inventory.js";
import dgram from 'dgram';

import blessed, { Widgets } from 'blessed';
const { box, checkbox, screen } = blessed;

const proxyOptions: UdpProxyOptions = {
    remoteAddress: '74.208.130.140',
    remotePort: 2593,
    localAddress: '0.0.0.0',
    localPort: 53535
};

class Run {
    private packetCount = 0;
    private proxy: UdpProxy;
    private options: UdpProxyOptions;
    private inventory: Inventory = new Inventory();
    private experience: Map<Date, number>;
    private combat: Map<Date, number>;
    private critical: Map<Date, number>;
    private combo: Map<Date, number>;
    private sessionStartTime: Date;
    private sessionTotalExperience: number;
    private sessionTotalCombat: number;
    private currentCharacter: string;
    private currentTarget: string;
    private parsingDPS: boolean;
    private inGame: boolean;

    private screen: Widgets.Screen;
    private damageBox: Widgets.BoxElement;
    private topLine: Widgets.BoxElement;
    private dataLine: Widgets.BoxElement;
    private incomingPacketRecord: Widgets.CheckboxElement;
    private outgoingPacketRecord: Widgets.CheckboxElement;

    private dps: number;
    private totalDamage: number;
    private expPerHour: number;

    private incomingPacketRecordingStatus: boolean;
    private outgoingPacketRecordingStatus: boolean;

    constructor(options: UdpProxyOptions) {
        this.options = options;
        this.parsingDPS = false;
        this.inGame = false;
        this.dps = 0;
        this.totalDamage = 0;
        this.expPerHour = 0;
        this.incomingPacketRecordingStatus = false;
        this.outgoingPacketRecordingStatus = false;

        this.createScreen();
    }

    public startProxy = (): void => {
        this.proxy = new UdpProxy(this.options);
        this.proxy.on('listening', (details) => {
            // console.dir(details);
            this.log('Listening ...');
        });
        this.proxy.on('bound', (details) => {
            // console.dir(details);
        });
        this.proxy.on('error', (error) => {
            this.log(JSON.stringify(error));
        });
        this.proxy.on('incomingMessage', (message, remoteInfo, peer) => {
            // console.log('incoming', message, remoteInfo, peer);
        });
        this.proxy.on('outgoingMessage', (message, remoteInfo) => {
            // console.log('outgoing', message, remoteInfo);
        });
        this.proxy.on('close', (peer) => {
            this.log('closed');
        });
        
        this.addTransforms();
    }

    private addTransforms = (): void => {
        const incomingTransform = (msg: Buffer, rinfo: dgram.RemoteInfo): Buffer => {
            const packets = splitPackets(msg);
            if(this.incomingPacketRecordingStatus) {
                this.recordPackets(packets, 'incoming');
            }
            this.parseIncomingPackets(packets, rinfo);
            return msg;
        }

        const outgoingTransform = (msg: Buffer, rinfo: dgram.RemoteInfo): Buffer => {
            const packets = splitPackets(msg);
            this.transformOutgoingPackets(packets, rinfo);
            if(this.outgoingPacketRecordingStatus) {
                this.recordPackets(packets, 'outgoing');
            }
            msg = combinePackets(packets);
            return msg;
        }

        this.proxy.addIncomingTransform(incomingTransform);
        this.proxy.addOutgoingTransform(outgoingTransform);
    }

    private recordPackets = (packets: Packet[], type: 'incoming' | 'outgoing'): void => {
        for(const packet of packets) {
            if(packet.type === 0x44) {
                const dataType = PacketCommand[packet.data.readUInt8()];
                fs.writeFile(join('output', `${this.packetCount++}-${type}-${dataType}.json`), JSON.stringify(packet, (k, v) => {
                    if(v?.type === 'Buffer') {
                        return {
                            Uint8Array: v.data,
                            HexArray: v.data.map((e: number) => e.toString(16).padStart(2, '0')),
                            CharArray: v.data.map((e: number) => String.fromCharCode(e))
                        }
                    }
                    if(k === 'type' && typeof v === 'number') {
                        return v.toString(16).padStart(2, '0');
                    }
                    return v;
                }, 4));
            }
        }
    }

    private parseIncomingPackets = (packets: Packet[], rinfo: dgram.RemoteInfo): void => {
        for(const packet of packets) {
            if(packet.type === 0x44) {
                const dataType = packet.data.readUInt8();
                switch(dataType) {
                    case PacketCommand.ServerContainerContent:
                        this.inventory.handleServerContainerContent(packet);
                        break;
                    case PacketCommand.ServerContainerClear:
                        this.inventory.handleServerContainerClear(packet);
                        break;
                    case PacketCommand.ServerContainerUpdate:
                        this.inventory.handleServerContainerUpdate(packet);
                        break;
                    case PacketCommand.ServerLocalizedAsciiMessage:
                        const idx = packet.data.readUInt32LE(6);
                        if(idx === 6300080) {
                            const expLength = packet.data.readUInt8(11);
                            let expStr = '';
                            for(let i = 12; i < 12 + expLength; i++) {
                                expStr += String.fromCharCode(packet.data.readUInt8(i));
                            }
                            const exp = parseInt(expStr);
                            this.experience.set(new Date(), exp);
                            this.sessionTotalExperience += exp;
                            const ONE_HOUR = 60 * 60 * 1000;
                            let earliest = new Date();
                            for(const d of this.experience.keys()) {
                                if(Date.now() - d.getTime() > ONE_HOUR) {
                                    this.experience.delete(d);
                                } else {
                                    if(d < earliest) {
                                        earliest = d;
                                    }
                                }
                            }
                            let acc = 0;
                            this.experience.forEach(v => acc += v);
                            const timeSpan = Date.now() - earliest.getTime();
                            const expPerTime = acc / timeSpan;
                            const expPerHour = Math.floor(expPerTime * 60 * 60 * 1000);
                            this.expPerHour = expPerHour;
                            this.updateDataLine();
                        }
                        break;
                    case PacketCommand.ServerAsciiMessage:
                        const msgLength = packet.data.readUInt8(5);
                        let msg = '';
                        for(let i = 6; i < 6 + msgLength; i++) {
                            msg += String.fromCharCode(packet.data.readUInt8(i));
                        }

                        let earliest = new Date();
                        let displayDpsMsg = false;

                        if(!this.parsingDPS) {
                            const startRegexp = /^(.*) \[0x[0-9A-F]+\] vs. (.*) \[0x[0-9A-F]+\]$/;
                            const startMatch = msg.match(startRegexp);
                            if(startMatch) {
                                if(startMatch[1] === this.currentCharacter) {
                                    this.parsingDPS = true;
                                    this.currentTarget = startMatch[2];
                                    this.topLine.setLine(0, `${this.currentCharacter} vs. ${this.currentTarget}`);
                                }
                            }
                        } else {
                            const damageRegexp = /\t.*?\[(spell)?(d|D)amage: ([0-9]+)\]/
                            const damageMatch = msg.match(damageRegexp);

                            if(damageMatch) {
                                const damage = parseInt(damageMatch[3]);
                                this.log(`You ${damageMatch[1] ? 'cast on' : 'hit'} ${this.currentTarget} for {blue-fg}${damage}{/blue-fg}`);
                                this.combat.set(new Date(), damage);
                                this.sessionTotalCombat += damage;
                                // const ONE_HOUR = 60 * 60 * 1000;
                                for(const d of this.combat.keys()) {
                                    if(Date.now() - d.getTime() > 10000) {
                                        this.combat.delete(d);
                                    } else {
                                        if(d < earliest) {
                                            earliest = d;
                                        }
                                    }
                                }
                                this.parsingDPS = false;
                                displayDpsMsg = true;
                            }                            
                        }

                        const critRegexp = /\(\+(\d+)\)/
                        const critMatch = msg.match(critRegexp);

                        if(critMatch) {
                            const crit = parseInt(critMatch[1]);
                            this.log(`You crit ${this.currentTarget} for {yellow-fg}${crit}{/yellow-fg}`);
                            this.critical.set(new Date(), crit);
                            this.sessionTotalCombat += crit;
                            for(const d of this.critical.keys()) {
                                if(Date.now() - d.getTime() > 10000) {
                                    this.critical.delete(d);
                                } else {
                                    if(d < earliest) {
                                        earliest = d;
                                    }
                                }
                            }
                        }

                        const comboDamage = /You combo (.*?) for ([0-9]+)./
                        const comboMatch = msg.match(comboDamage);

                        if(comboMatch) {
                            const combo = parseInt(comboMatch[2]);
                            this.log(`You combo ${comboMatch[1]} for {green-fg}${combo}{/green-fg}`);
                            this.combo.set(new Date(), combo);
                            this.sessionTotalCombat += combo;
                            for(const d of this.combo.keys()) {
                                if(Date.now() - d.getTime() > 10000) {
                                    this.combo.delete(d);
                                } else {
                                    if(d < earliest) {
                                        earliest = d;
                                    }
                                }
                            }
                        }

                        if(displayDpsMsg && this.combat.size >= 5) {
                            let acc = 0;
                            this.combat.forEach(v => acc += v);
                            this.critical.forEach(v => acc += v);
                            this.combo.forEach(v => acc += v);
                            const timeSpan = Date.now() - earliest.getTime();
                            const combatPerTime = acc / timeSpan;
                            const combatPerSecond = Math.floor(combatPerTime * 1000);
                            const sessionTotalDamage = Math.floor(this.sessionTotalCombat);
                            this.dps = combatPerSecond;
                            this.totalDamage = sessionTotalDamage;
                            this.updateDataLine();
                            
                        }

                        break;
                    case PacketCommand.ServerChangeState:
                        const state: ServerState = packet.data.readUInt8(1);
                        if(state === ServerState.InGame) {
                            this.inGame = true;
                            const charLength = packet.data.readUInt8(2);
                            let charName = '';
                            for(let i = 3; i < 3 + charLength; i++) {
                                charName += String.fromCharCode(packet.data.readUInt8(i));
                            }
                            this.currentCharacter = charName;
                        } else {
                            this.inGame = false;
                        }
                        break;
                }
            } 
        }
    }

    private transformOutgoingPackets = (packets: Packet[], rinfo: dgram.RemoteInfo): void => {
        for(const packet of packets) {
            if(packet.type === 0x44) {
                const dataType = packet.data.readUInt8();
                switch(dataType) {
                    case PacketCommand.ClientPlayRequest:
                        this.sessionStartTime = new Date();
                        this.experience = new Map<Date, number>();
                        this.combat = new Map<Date, number>();
                        this.critical = new Map<Date, number>();
                        this.combo = new Map<Date, number>();
                        this.sessionTotalExperience = 0;
                        this.sessionTotalCombat = 0;
                        break;
                }
            }
        }
    }

    private createScreen = (): void => {
        this.screen = screen({
            smartCSR: true,
            title: 'Stormhalter Packet Parser'
        });

        this.topLine = box({
            parent: this.screen,
            top: 0,
            left: 'center',
            width: '75%',
            height: 3,
            tags: true,
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                bg: 'black',
                border: {
                    fg: '#f0f0f0'
                }
            }
        });

        this.damageBox = box({
            parent: this.screen,
            top: 3,
            left: 'center',
            width: '75%',
            height: 20,
            tags: true,
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                bg: 'black',
                border: {
                    fg: '#f0f0f0'
                }
            },
            scrollable: true,
            alwaysScroll: true
        });

        this.dataLine = box({
            parent: this.screen,
            top: 23,
            left: 'center',
            width: '75%',
            height: 3,
            tags: true,
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                bg: 'black',
                border: {
                    fg: '#f0f0f0'
                }
            }
        });

        this.incomingPacketRecord = checkbox({
            parent: this.screen,
            top: 26,
            left: 'center',
            mouse: true,
            keys: true,
            checked: false,
            content: 'Record Incoming Packets'
        });

        this.incomingPacketRecord.on('check', () => this.incomingPacketRecordingStatus = true);
        this.incomingPacketRecord.on('uncheck', () => this.incomingPacketRecordingStatus = false);

        this.outgoingPacketRecord = checkbox({
            parent: this.screen,
            top: 27,
            left: 'center',
            mouse: true,
            keys: true,
            checked: false,
            content: 'Record Outgoing Packets'
        });

        this.outgoingPacketRecord.on('check', () => this.outgoingPacketRecordingStatus = true);
        this.outgoingPacketRecord.on('uncheck', () => this.outgoingPacketRecordingStatus = false);

        this.screen.key(['escape', 'q', 'C-c'], (): void => {
            return process.exit(0);
        });

        this.screen.key('z', () => {
            this.incomingPacketRecord.toggle();
            this.screen.render();
        });

        this.screen.key('x', () => {
            this.outgoingPacketRecord.toggle();
            this.screen.render();
        });

        this.screen.render();
        // this.updateDataLine();
    }

    private updateDataLine = (): void => {
        const elapsedTime = Math.floor((Date.now() - this.sessionStartTime.getTime()) / 1000);
        const elapsedHours = Math.floor(elapsedTime / 3600);
        const elapsedMinutes = Math.floor((elapsedTime - (elapsedHours * 3600)) / 60);
        const elapsedSeconds = elapsedTime - (elapsedHours * 3600) - (elapsedMinutes * 60);
        const elapsedTimeString = `${elapsedHours.toString().padStart(2, '0')}:${elapsedMinutes.toString().padStart(2, '0')}:${elapsedSeconds.toString().padStart(2, '0')}`

        this.dataLine.setLine(0, `[${elapsedTimeString}]\tEXP/Hr: ${this.expPerHour.toLocaleString('en-US')}\tEXP Total: ${this.sessionTotalExperience.toLocaleString('en-US')}\tDPS: ${this.dps.toLocaleString('en-US')}\tDamage Total: ${this.totalDamage.toLocaleString('en-US')}`);
        this.screen.render();
    }

    public log = (text: string): void => {
        this.damageBox.pushLine(text);
        this.damageBox.setScrollPerc(100);
        this.screen.render();
    }
}

(async () => {
    const run = new Run(proxyOptions);
    run.startProxy();
})().catch((err) => console.error(err));
