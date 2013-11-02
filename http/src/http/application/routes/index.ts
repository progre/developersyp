import http = require('http');
var dateformat = require('dateformat');
var clone = require('clone');
import putil = require('./../../../common/util');
import rootserver = require('./../../infrastructure/rootserver');
import ch = require('./../../domain/entity/channel');
import db = require('./../../infrastructure/database');

var serverComment = {
    id: '00000000000000000000000000000000',
    info: {
        name: 'DP◆お知らせ',
        url: 'http://dp.prgrssv.net/',
        genre: '',
        desc: '2013/11/2 Powered by node.',
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

function getServerComment() {
    serverComment.info.genre = rootServerIndexRepository.channelsLength() + ' channel(s).';
    serverComment.info.comment
    = 'HTTP server uptime: ' + uptimeToString(process.uptime())
    + ', Root server uptime: ' + uptimeToString(rootServerIndexRepository.uptime());
    return serverComment;
}

function uptimeToString(uptime: number) {
    var uptimeSec = uptime | 0;
    var second = uptimeSec % 60;
    var min = (uptimeSec / 60 | 0) % 360;
    var hour = (uptimeSec / 3600 | 0) % 216000;
    var day = (uptimeSec / 86400 | 0) % 5184000;
    var year = (uptimeSec / 31536000 | 0) % 1892160000;
    var str = '';
    if (year > 0) {
        str += year + 'year ';
    }
    if (day > 0) {
        str += day + 'day ';
    }
    return str + hour + ':'
        + putil.padLeft(min.toString(), 2, '0') + ':'
        + putil.padLeft(second.toString(), 2, '0');
}

// このへんの処理はクラスにすべき
if (process.env.NODE_ENV === 'production')
    var rootServerIndexRepository = new rootserver.RootServerIndexRepository();

export var routings = {
    '/index.txt': (req: ExpressServerRequest, res: ExpressServerResponse) => {
        var channels = rootServerIndexRepository.getChannels();
        if (channels == null) {
            var maintenance = clone(getServerComment());
            maintenance.info.comment = '只今サーバーのメンテナンス中です';
            res.send(200, toIndex(maintenance));
            return;
        }
        var content = '';
        content += toIndex(getServerComment());
        convertForYP(channels).forEach((channel: ch.Channel) => {
            channel['time'] = putil.secondsToHoursMinutes(channel.host.uptime);
            content += toIndex(channel);
        });
        res.send(200, content);
    },
    // 未使用
    '/channels.json': (req, res) => {
        res.send(200, convertForYP(rootServerIndexRepository.getChannels() || []));
    },
    // 未使用
    '/done-channels.json': (req, res) => {
        db.doneChannels.toArray(doneChannels =>
            res.send(200, convertForYP2(doneChannels || [])));
    }
}

function convertForYP(channels: ch.Channel[]) {
    return channels.map(x => {
        var options = parseGenre(x.info.genre);
        x.info.genre = options.genre;
        if (options.isListenerInvisible) {
            x.host.listeners = -1;
            x.host.relays = -1;
        }
        if (x.info.bitrate == null) {
            x.info.bitrate = 0;
            x.info.name += ' (incoming...)';
        }
        return x;
    });
}

function convertForYP2(doneChannels: ch.DoneChannel[]) {
    return doneChannels.map(x => {
        var options = parseGenre(x.channel.info.genre);
        x.channel.info['parsedGenre'] = options.genre;
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
                            socket.emit('post', {
                                '/channels': convertForYP(rootServerIndexRepository.getChannels() || [])
                            });
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
