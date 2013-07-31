import net = require('net');
import http = require('http');
import log4js = require('log4js');
import putil = require('./util');
import ch = require('./channel');
import pcp = require('./pcp');
import GID = require('./gid');
import PcpServerSocket = require('./pcpserversocket');
import httpRequestListener = require('./httprequestlistener');

log4js.configure({
    appenders: [
        {
            category: 'root-pcp',
            type: 'dateFile',
            filename: 'log/root-pcp.log',
            pattern: '-yyyy-MM-dd'
        },
        {
            category: 'root-http',
            type: 'dateFile',
            filename: 'log/root-http.log',
            pattern: '-yyyy-MM-dd'
        }]
});
var pcpLogger = log4js.getLogger('root-pcp');
var httpLogger = log4js.getLogger('root-http');

export interface NodeSocket2 extends net.NodeSocket, ReadableStream2 {
}

export class RootServer {
    private _sessionId = GID.generate();
    private channels: { [channelId: string]: ch.Channel; } = {};

    constructor(private pcpPort: number, private httpPort: number) {
    }

    get sessionId() { return this._sessionId; }

    listen() {
        net.createServer(
            (client: NodeSocket2) => new PcpServerSocket(this, client, pcpLogger)
            ).listen(this.pcpPort, () => {
                pcpLogger.info('pcp-server bound. port: ' + this.pcpPort);
            });

        http.createServer((req, res) =>
            httpRequestListener(req, res, this.channels, httpLogger)
        ).listen(this.httpPort, () => {
            httpLogger.info('http-server bound. port: ' + this.httpPort);
        });
    }

    putHost(host: ch.Host, atom: pcp.Atom) {
        var sessionId: GID = atom.get(pcp.HOST_ID);
        var channelId: GID = atom.get(pcp.HOST_CHANID);
        if (channelId == null)
            throw new Error('channel id not found');
        var channel = this.channels[channelId.to_s()];
        if (channel == null || !sessionId.equals(host.session_id))
            return;
        channel.putHost(sessionId, host, atom);
    }

    addChannel(host: ch.Host, atom: pcp.Atom) {
        var channelId: GID = atom.get(pcp.CHAN_ID);
        if (channelId == null)
            throw new Error('channel id not found');
        var channel = this.channels[channelId.to_s()];
        if (channel == null && host.broadcast_id != null) {
            channel = new ch.Channel(channelId, host.broadcast_id, null, null, {});
            this.channels[channelId.to_s()] = channel;
        }
        if (!channel.broadcast_id.equals(host.broadcast_id)) {
            return;
        }
        channel.update(atom);
    }

    removeChannel(broadcastId: GID) {
        putil.deleteIf2(this.channels,
            channel => channel.broadcast_id.equals(broadcastId));
    }
}
