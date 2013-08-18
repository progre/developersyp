import http = require('http');
var dateformat = require('dateformat');
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
    '/': (req, res) => {
        res.render('index', { name: 'index' });
    },
    '/list.html': (req, res) => {
        rootserver.getIndexJsonAsync(channels => {
            if (channels == null) {
                res.render('list', { name: 'list', channels: [] });
                return;
            }
            channels = convertForYP(channels);
            channels.unshift(SERVER_COMMENT);

            db.doneChannels.toArray(doneChannels => {
                res.render('list', {
                    name: 'list',
                    channels: channels.map(x => {
                        x['time'] = toHoursMinutes(x.host.uptime);
                        return x;
                    }),
                    doneChannels: convertForYP2(doneChannels || [])
                });
            });
        });
    },
    '/info.html': (req, res) => {
        res.render('info', { name: 'info' });
    },
    '/terms.html': (req, res) => {
        res.render('terms', { name: 'terms' });
    },
    '/index.txt': (req: ExpressServerRequest, res: ExpressServerResponse) => {
        rootserver.getIndexJsonAsync(channels => {
            if (channels == null) {
                res.send(500);
                return;
            }
            var content = '';
            content += toIndex(SERVER_COMMENT);
            convertForYP(channels).forEach((channel: ch.Channel) => {
                content += toIndex(channel);
            });
            res.send(200, content);
        });
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
        x['beginText'] = format(x.begin);
        x['endText'] = format(x.end);
        return x;
    });
}

function format(date: Date) {
    var jst = new Date(date.getTime());
    jst.setHours(jst.getHours() + 9);// UTC+9
    return dateformat(jst, 'UTC:yy/m/dd HH:MM');
}

function parseGenre(genre: string) {
    var m = genre.match(/^dp(\?)?(.*)$/);
    return {
        genre: m[2],
        isListenerInvisible: m[1] != null
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
        + toHoursMinutes(channel.host.uptime) + '<>'
        + 'click' + '<>'
        + channel.info.comment + '<>'
        + (channel.host.direct ? '1' : '0') + '\n';
}

function toHoursMinutes(sec: number) {
    var minutes = sec / 60 | 0;
    var h = minutes / 60 | 0;
    var m = minutes - h * 60 | 0;
    return h + ':' + putil.padLeft("" + m, 2, '0');
}
