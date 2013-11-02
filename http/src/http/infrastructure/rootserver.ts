import http = require('http');
var log4js = require('log4js');
var clone = require('clone');
var socketIoClient = require('socket.io-client');
import ch = require('./../domain/entity/channel');
import db = require('./../infrastructure/database');

var ROOT_SERVER = 'ws://root-dp.prgrssv.net:7180';

/** �V�X�e����1�ڑ� */
export class RootServerIndexRepository {
    private connectionStartedAt: Date;
    channels: ch.Channel[] = null;

    constructor() {
        this.connect();
    }

    /** �R�l�N�V�����J�n����̎��Ԃ�b�ŕԂ� */
    uptime() {
        return (<any>new Date() - <any>this.connectionStartedAt) / 1000;
    }

    getChannels() {
        if (this.channels == null)
            return null;
        return this.channels.map(x => clone(x));
    }

    private connect() {
        this.channels = null;
        var logger = log4js.getLogger('app');
        logger.info('connecting...');
        var server = socketIoClient.connect(ROOT_SERVER, {
            'force new connection': true
        });
        var connected = false;
        server.on('connect', () => {
            logger.info('connected.');
            this.connectionStartedAt = new Date();
            connected = true;

            server.on('channels', (channels: ch.Channel[]) => {
                this.channels = channels;
            });
            server.on('channel', (channel: ch.Channel) => {
                var index = indexOf(this.channels, channel);
                if (index < 0) {
                    // �V�K
                    this.channels.push(channel);
                } else {
                    // �X�V
                    this.channels[index] = channel;
                }
            });
            server.on('deleteChannel', (channel: ch.Channel) => {
                var index = indexOf(this.channels, channel);
                if (index >= 0) {
                    this.channels.splice(index, 1);
                }
                var end = new Date();
                var begin = new Date(end.getTime());
                begin.setSeconds(begin.getSeconds() - channel.host.uptime);
                db.doneChannels.add({
                    begin: begin,
                    end: end,
                    channel: channel
                });
            });
            server.on('disconnect', () => {
                logger.info('disconnect');
                this.connect();
            });
        });
        server.on('error', err => {
            logger.error(JSON.stringify(err));
            server.disconnect();
            if (connected) {
                return;
            }
            this.connect();
        });
    }
}

function indexOf(channels: ch.Channel[], channel: ch.Channel) {
    for (var i = 0, len = channels.length; i < len; i++) {
        if (channels[i].info.name !== channel.info.name)
            continue;
        return i;
    }
    return -1;
}
