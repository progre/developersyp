import http = require('http');
import putil = require('../common/util');

var rootServer = 'http://dp.prgrssv.net:10001/snsbt_edimt6wfgkz_y4cmyr-zjru9s449_ybdw8wyt56c3nuggam8428jwm5269';
export var routings = {
    '/': (req, res) => {
        res.render('index', { name: 'index' });
    },
    '/list.html': (req, res) => {
        http.get(rootServer, (proxyRes: http.ClientResponse) => {
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
                var channels: Channel[] = JSON.parse(body);
                res.render('list', {
                    name: 'list', channels: channels.map(x => {
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
        http.get(rootServer, (proxyRes: http.ClientResponse) => {
            if (proxyRes.statusCode !== 200) {
                res.status(500);
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
                var channels: Channel[] = JSON.parse(body);
                channels.forEach(channel => {
                    content += channel.info.name + '<>';
                    content += channel.id + '<>';
                    content += channel.host.ip + '<>';
                    content += channel.info.url + '<>';
                    content += channel.info.genre + '<>';
                    content += channel.info.desc + '<>';
                    content += channel.host.listeners + '<>';
                    content += channel.host.relays + '<>';
                    content += channel.info.bitrate + '<>';
                    content += channel.info.type + '<>';
                    content += channel.track.creator + '<>';
                    content += channel.track.album + '<>';
                    content += channel.track.title + '<>';
                    content += channel.track.url + '<>';
                    content += encodeURI(channel.info.name) + '<>';
                    content += toHoursMinutes(channel.host.uptime) + '<>';
                    content += 'click' + '<>';
                    content += channel.host.direct ? '1' : '0' + '\n';
                });
                res.send(200, content);
            });
        }).on('error', e => {
                console.error("Got error: " + e.message);
            });
    }
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
