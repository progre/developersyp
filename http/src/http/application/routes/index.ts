import http = require('http');
var dateformat = require('dateformat');
var clone = require('clone');
import putil = require('./../../../common/util');
import rootserver = require('./../../infrastructure/rootserver');
import ch = require('./../../domain/entity/channel');
import db = require('./../../infrastructure/database');

var ROOT_SERVER = 'http://root-dp.prgrssv.net:7180/snsbt_edimt6wfgkz_y4cmyr-zjru9s449_ybdw8wyt56c3nuggam8428jwm5269';
var SERVER_COMMENT = {
    id: '00000000000000000000000000000000',
    info: {
        name: 'DP - お知らせ',
        url: 'http://dp.prgrssv.net/',
        genre: '試験運用中',
        desc: '2013/8/4 Powered by node.',
        bitrate: 0,
        type: 'RAW',
        comment: ''
    },
    host: {
        ip: '',
        listeners: -9,
        relays: -9,
        direct: false,
        uptime: 0
    },
    track: {
        creator: '',
        album: '',
        title: '',
        url: ''
    }
};

export var routings = {
    '/index.txt': (req: ExpressServerRequest, res: ExpressServerResponse) => {
        rootserver.getIndexJsonAsync(channels => {
            if (channels == null) {
                var maintenance = clone(SERVER_COMMENT);
                maintenance.info.comment = '只今サーバーのメンテナンス中です';
                res.send(200, toIndex(maintenance));
                return;
            }
            var content = '';
            content += toIndex(SERVER_COMMENT);
            convertForYP(channels).forEach((channel: ch.Channel) => {
                channel['time'] = putil.secondsToHoursMinutes(channel.host.uptime);
                content += toIndex(channel);
            });
            res.send(200, content);
        });
    },
    '/channels.json': (req, res) => {
        rootserver.getIndexJsonAsync(channels =>
            res.send(200, convertForYP(channels || [])));
    },
    '/done-channels.json': (req, res) => {
        db.doneChannels.toArray(doneChannels =>
            res.send(200, convertForYP2(doneChannels || [])));
    }
}

function convertForYP(channels: ch.Channel[]) {
    return channels.filter(x => x.info.type != null).map(x => {
        var options = parseGenre(x.info.genre);
        x.info.genre = options.genre;
        if (options.isListenerInvisible) {
            x.host.listeners = -1;
            x.host.relays = -1;
        }
        return x;
    });
}

function convertForYP2(doneChannels: ch.DoneChannel[]) {
    return doneChannels.map(x => {
        var options = parseGenre(x.channel.info.genre);
        x.channel.info.genre = options.genre;
        x.channel.info.desc = x.channel.info.desc.replace(/\d+\.\d+\.\d+\.\d+/, '*.*.*.*');// IP隠し
        x.channel.info.comment = x.channel.info.comment.replace(/\d+\.\d+\.\d+\.\d+/, '*.*.*.*');
        x['beginText'] = format(x.begin);
        x['endText'] = format(x.end);
        return x;
    });
}

function format(date: Date) {
    var jst = new Date(date.getTime());
    jst.setHours(jst.getHours() + 9);// UTC+9
    return dateformat(jst, 'UTC:m/dd HH:MM');
}

function parseGenre(genre: string) {
    var m = genre.match(/^dp(\?)?(.*)$/);
    return {
        genre: m == null ? '' : m.length <= 2 ? '' : m[2],
        isListenerInvisible: m == null ? true : m.length <= 1 ? false : m[1] != null
    };
}

function toIndex(channel: ch.Channel) {
    return channel.info.name + '<>'
        + channel.id + '<>'
        + channel.host.ip + '<>'
        + channel.info.url + '<>'
        + channel.info.genre + '<>'
        + channel.info.desc + '<>'
        + channel.host.listeners + '<>'
        + channel.host.relays + '<>'
        + channel.info.bitrate + '<>'
        + channel.info.type + '<>'
        + channel.track.creator + '<>'
        + channel.track.album + '<>'
        + channel.track.title + '<>'
        + channel.track.url + '<>'
        + encodeURI(channel.info.name) + '<>'
        + putil.secondsToHoursMinutes(channel.host.uptime) + '<>'
        + 'click' + '<>'
        + channel.info.comment + '<>'
        + (channel.host.direct ? '1' : '0') + '\n';
}

export class WebSocket {
    constructor(socket: any) {
        socket.on('get', data => {
            if (Array.isArray(data)) {
                (<string[]>data).forEach(data => {
                    switch (data) {
                        case '/channels':
                            rootserver.getIndexJsonAsync(channels =>
                                socket.emit('post', { '/channels': convertForYP(channels || []) }));
                            break;
                        case '/done-channels':
                            db.doneChannels.toArray(doneChannels =>
                                socket.emit('post', { '/done-channels': convertForYP2(doneChannels || []) }));
                            break;
                    }
                });
            }
        });
    }
}
