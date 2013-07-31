import log4js = require('log4js');
import http = require('http');
import putil = require('./util');
import ch = require('./channel');
import pcp = require('./pcp');
import GID = require('./gid');

export = httpRequestListener;
function httpRequestListener(
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
    channels: { [channelId: string]: ch.Channel; }, logger: log4js.Logger
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

    var slims = [];
    for (var key in channels) {
        var channel = channels[key];
        if (channel == null) {
            logger.fatal('null in channels');
            continue;
        }
        var info = channel.info;
        if (info == null) {
            logger.error('channel_info is null. ' + JSON.stringify(channel));
            continue;
        }
        var id = channel.channel_id;
        if (id == null) {
            logger.error('channel_id is null. ' + JSON.stringify(channel));
            continue;
        }
        var host = putil.firstOrUndefined(channel.hosts);
        var track = channel.track;
        slims.push(slim(channel.channel_id, info, host, track));
    }
    res.write(JSON.stringify(slims));
    res.end();
}

function slim(id: GID, info: pcp.Atom, host: ch.Host, track: pcp.Atom) {
    return {
        ip: host == null ? '0.0.0.0:0' : joinIpPort(host.ip, host.port),
        id: id,
        name: info.get(pcp.CHAN_INFO_NAME),
        url: info.get(pcp.CHAN_INFO_URL),
        genre: info.get(pcp.CHAN_INFO_GENRE),
        desc: info.get(pcp.CHAN_INFO_DESC),
        listeners: host.info.get(pcp.HOST_NUML),
        relays: host.info.get(pcp.HOST_NUMR),
        bitrate: info.get(pcp.CHAN_INFO_BITRATE),
        type: info.get(pcp.CHAN_INFO_TYPE),
        track: track == null ? null : {
            creator: track.get(pcp.CHAN_TRACK_CREATOR),
            album: track.get(pcp.CHAN_TRACK_ALBUM),
            title: track.get(pcp.CHAN_TRACK_TITLE),
            url: track.get(pcp.CHAN_TRACK_URL)
        },
        uptime: track.get(pcp.HOST_UPTIME),
        comment: info.get(pcp.CHAN_INFO_COMMENT),
        direct: (<number>host.info.get(pcp.HOST_FLAGS1)) & pcp.HOST_FLAGS1_DIRECT
    };
}

function joinIpPort(ip: string, port: number) {
    return putil.ifNullThen(ip, '0.0.0.0') + ':' + putil.ifNullThen(port, 0);
}
