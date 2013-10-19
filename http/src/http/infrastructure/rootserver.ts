import http = require('http');
var log4js = require('log4js');
var socketIoClient = require('socket.io-client');
import ch = require('./../domain/entity/channel');
import db = require('./../infrastructure/database');

var ROOT_SERVER = 'ws://root-dp.prgrssv.net:7180';
var ROOT_URI = 'http://root-dp.prgrssv.net:7180/snsbt_edimt6wfgkz_y4cmyr-zjru9s449_ybdw8wyt56c3nuggam8428jwm5269';

export function getIndexJsonAsync(callback: (channels: ch.Channel[]) => void): void {
    var req = http.get(ROOT_URI, (proxyRes: http.ClientResponse) => {
        if (proxyRes.statusCode !== 200) {
            callback(null);
            return;
        }
        var body = '';
        proxyRes.setEncoding('utf-8');
        proxyRes.on('readable', () => {
            var data = (<any>proxyRes).read();
            if (data == null)
                return;
            body += data;
        });
        proxyRes.on('end', () => {
            callback(JSON.parse(body));
        });
    });
    req.setTimeout(1 * 1000, () => {
        req.abort();
        callback(null);
    });
    req.on('error', e => {
        console.error("Got error: " + e.message);
        callback(null);
    });
}

/** システムで1接続 */
export class RootServerIndexRepository {
    channels: ch.Channel[] = null;

    constructor() {
        this.connect();
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
            connected = true;

            server.on('channels', (channels: ch.Channel[]) => {
                this.channels = channels;
            });
            server.on('channel', (channel: ch.Channel) => {
                var index = indexOf(this.channels, channel);
                if (index < 0) {
                    // 新規
                    this.channels.push(channel);
                } else {
                    // 更新
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

function indexOf(channels:ch.Channel[], channel:ch.Channel) {
    for (var i = 0, len = channels.length; i < len; i++) {
        if (channels[i].info.name !== channel.info.name)
            continue;
        return i;
    }
    return -1;
}
