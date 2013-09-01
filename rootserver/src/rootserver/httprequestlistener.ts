import log4js = require('log4js');
import http = require('http');
import putil = require('./../common/util');
import ch = require('./channel');
import pcp = require('./pcp');
import GID = require('./gid');

export interface Channels {
    [channelId: string]: ch.Channel;
}

export function httpRequestListener(
    req: http.ServerRequest, res: http.ServerResponse,
    channels: { [channelId: string]: ch.Channel; }, logger: log4js.Logger
    ) {
    try {
        onRequest(req, res, channels, logger);
    } catch (e) {
        logger.error('uncaughtException: ' + e + ', stack: ' + e.stack);
        res.statusCode = 500;
        res.write('500');
        res.end();
    }
}
function onRequest(
    req: http.ServerRequest, res: http.ServerResponse,
    channels: Channels, logger: log4js.Logger
    ) {
    if (req.method !== 'GET') {
        res.statusCode = 405;
        res.end();
        return;
    }
    if (req.url !== '/snsbt_edimt6wfgkz_y4cmyr-zjru9s449_ybdw8wyt56c3nuggam8428jwm5269') {
        res.statusCode = 404;
        res.write('404');
        res.end();
        return;
    }

    res.write(JSON.stringify(toSlims(channels)));
    res.end();
}

export class WebSocket {
    private socket: any;

    onConnection(socket: any, channels: Channels) {
        var wsLogger = log4js.getLogger('root-ws');
        var address = socket.handshake.address;
        wsLogger.info('ws-server was connected from ' + address.address + ':' + address.port);
        this.socket = socket;
        socket.emit('channels', toSlims(channels));
    }

    updateChannel(channel: ch.Channel) {
        if (this.socket == null)
            return;
        var s = slim(channel);
        if (s == null)
            return;
        this.socket.emit('channel', s);
    }

    deleteChannel(channel: ch.Channel) {
        if (this.socket == null)
            return;
        this.socket.emit('deleteChannel', slim(channel));
    }
}

function toSlims(channels: Channels) {
    var slims = [];
    for (var key in channels) {
        var s = slim(channels[key]);
        if (s == null)
            continue;
        slims.push(s);
    }
    return slims;
}

function slim(channel: ch.Channel) {
    var logger = log4js.getLogger('root-http');
    if (channel == null) {
        logger.fatal('null in channels');
        return null;
    }
    var info = channel.info;
    if (info == null) {
        logger.error('channel_info is null. ' + JSON.stringify(channel));
        return null;
    }
    var id = channel.channelId;
    if (id == null) {
        logger.error('channel_id is null. ' + JSON.stringify(channel));
        return null;
    }
    var host = putil.firstOrUndefined(channel.hosts);
    return slim2(channel.channelId, info, host == null ? null : host.info, channel.track);
}

function slim2(id: GID, info: pcp.Atom, hostInfo: pcp.Atom, track: pcp.Atom) {
    return {
        id: hostInfo == null ? '00000000000000000000000000000000' : id.toString(),
        info: {
            name: hostInfo == null ? info.get(pcp.CHAN_INFO_NAME) + ' (incoming...)' : info.get(pcp.CHAN_INFO_NAME),
            url: info.get(pcp.CHAN_INFO_URL),
            genre: info.get(pcp.CHAN_INFO_GENRE),
            desc: info.get(pcp.CHAN_INFO_DESC),
            bitrate: info.get(pcp.CHAN_INFO_BITRATE),
            type: info.get(pcp.CHAN_INFO_TYPE),
            comment: info.get(pcp.CHAN_INFO_COMMENT)
        },
        host: hostInfo == null ? {
            ip: '', listeners: 0, relays: 0, direct: false, uptime: 0
        } : {
            ip: joinIpPort(first(hostInfo.get(pcp.HOST_IP)), first2(hostInfo.get(pcp.HOST_PORT))),
            listeners: <number>hostInfo.get(pcp.HOST_NUML),
            relays: <number>hostInfo.get(pcp.HOST_NUMR),
            direct: ((<number>hostInfo.get(pcp.HOST_FLAGS1)) & pcp.HOST_FLAGS1_DIRECT) != 0,
            uptime: <number>hostInfo.get(pcp.HOST_UPTIME)
        },
        track: track == null ? null : {
            creator: track.get(pcp.CHAN_TRACK_CREATOR),
            album: track.get(pcp.CHAN_TRACK_ALBUM),
            title: track.get(pcp.CHAN_TRACK_TITLE),
            url: track.get(pcp.CHAN_TRACK_URL),
        },
    };
}

function first(obj: any[]) {
    if (!Array.isArray(obj[0])) {
        return obj;
    }
    return obj[0];
}
function first2(obj: any) {
    if (!Array.isArray(obj)) {
        return obj;
    }
    return obj[0];
}

function joinIpPort(ip: number[], port: number) {
    return putil.ifNullThen(ip, [0, 0, 0, 0]).join('.') + ':' + putil.ifNullThen(port, 0);
}

function firstGlobalIP(ips: number[][], ports: number[]) {
    for (var i = 0, len = ips.length; i < len; i++) {
        if (isPrivateIP(ips[i]))
            continue;
        return joinIpPort(ips[i], ports[i]);
    }
}

function isPrivateIP(ip: number[]) {
    if (ip[0] === 10
        || ip[0] === 172 && 16 <= ip[1] && ip[1] <= 31
        || ip[0] === 192 && ip[1] === 168) {
        return true;
    }
    return false;
}