import http = require('http');
import putil = require('../common/util');

var ROOT_SERVER = 'http://127.0.0.1:7180/snsbt_edimt6wfgkz_y4cmyr-zjru9s449_ybdw8wyt56c3nuggam8428jwm5269';
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
        http.get(ROOT_SERVER, (proxyRes: http.ClientResponse) => {
            if (proxyRes.statusCode !== 200) {
                res.status(500);
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
                var channels = convertForYP(<Channel[]>JSON.parse(body));
                channels.unshift(SERVER_COMMENT);
                res.render('list', {
                    name: 'list', channels: channels
                        .map(x => {
                            x['time'] = toHoursMinutes(x.host.uptime);
                            return x;
                        })
                });
            });
        }).on('error', e => {
                console.error("Got error: " + e.message);
                res.render('list', { name: 'list', channels: [] });
            });
    },
    '/info.html': (req, res) => {
        res.render('info', { name: 'info' });
    },
    '/terms.html': (req, res) => {
        res.render('terms', { name: 'terms' });
    },
    '/index.txt': (req: ExpressServerRequest, res: ExpressServerResponse) => {
        var proxyReq = http.get(ROOT_SERVER, (proxyRes: http.ClientResponse) => {
            if (proxyRes.statusCode !== 200) {
                res.send(500);
                return;
            }
            var body = '';
            res.charset = 'utf-8';
            res.contentType('text/plain');
            proxyRes.setEncoding('utf-8');
            proxyRes.on('readable', () => {
                var data = (<any>proxyRes).read();
                if (data == null)
                    return;
                body += data;
            });
            proxyRes.on('end', () => {
                var content = '';
                content += toIndex(SERVER_COMMENT);
                var channels: Channel[] = JSON.parse(body);
                convertForYP(channels).forEach(channel => {
                    content += toIndex(channel);
                });
                res.send(200, content);
            });
        });
        proxyReq.setTimeout(10 * 1000, () => {
            res.send(500);
        });
        proxyReq.on('error', e => {
            console.error("Got error: " + e.message);
        });
    }
}

function convertForYP(channels: Channel[]) {
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

function parseGenre(genre: string) {
    var m = genre.match(/^dp(\?)?(.*)$/);
    return {
        genre: m[2],
        isListenerInvisible: m[1] != null
    };
}

function toIndex(channel: Channel) {
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

interface Channel {
    id: string;
    info: {
        name: string;
        url: string;
        genre: string;
        desc: string;
        bitrate: number;
        type: string;
        comment: string;
    };
    host: {
        ip: string;
        listeners: number;
        relays: number;
        direct: boolean;
        uptime: number;
    };
    track: {
        creator: string;
        album: string;
        title: string;
        url: string;
    };
}
