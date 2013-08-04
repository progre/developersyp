import fs = require('fs');
import net = require('net');
import http = require('http');
import log4js = require('log4js');
import putil = require('./util');
import ch = require('./channel');
import pcp = require('./pcp');
import GID = require('./gid');
import PcpServerSocket = require('./pcpserversocket');
import httpRequestListener = require('./httprequestlistener');

export interface NodeSocket2 extends net.NodeSocket, ReadableStream2 {
}

export class RootServer {
    private _sessionId = GID.generate();
    private channels: { [channelId: string]: ch.Channel; } = {};
    private pcp: net.Server;
    private http: http.Server;

    constructor(private pcpPort: number, private httpPort: number) {
    }

    get sessionId() { return this._sessionId; }

    listen() {
        var pcpLogger = log4js.getLogger('root-pcp');
        this.pcp = net.createServer((client: NodeSocket2) =>
            new PcpServerSocket(this, client, pcpLogger)
            );
        this.pcp.on('error', e => {
            pcpLogger.info('pcp-server error. ' + JSON.stringify(e));
        });
        this.pcp.on('close', () => {
            pcpLogger.info('pcp-server close.');
        });
        this.pcp.listen(this.pcpPort, () => {
            pcpLogger.info('pcp-server bound. port: ' + this.pcpPort);
        });

        var httpLogger = log4js.getLogger('root-http');
        this.http = http.createServer((req, res) =>
            httpRequestListener(req, res, this.channels, httpLogger)
            );
        this.http.listen(this.httpPort, () => {
            httpLogger.info('http-server bound. port: ' + this.httpPort);
        });
    }

    close() {
        this.pcp.close();
        this.http.close();
    }

    putHost(host: ch.Host, atom: pcp.Atom) {
        if ((atom.get(pcp.HOST_FLAGS1) & pcp.HOST_FLAGS1_RECV) === 0) {
            this.removeChannel(atom.get(pcp.HOST_CHANID));
            return;
        }
        var sessionId: GID = atom.get(pcp.HOST_ID);
        var channelId: GID = atom.get(pcp.HOST_CHANID);
        if (channelId == null)
            throw new Error('channel id not found');
        var channel = this.channels[channelId.toString()];
        if (channel == null || !sessionId.equals(host.sessionId))
            return;
        channel.putHost(sessionId, host, atom);
    }

    putChannel(atom: pcp.Atom, broadcastId: GID) {
        var channelId: GID = atom.get(pcp.CHAN_ID);
        if (channelId == null)
            throw new Error('channel id not found');
        var channel = this.channels[channelId.toString()];
        if (channel == null && broadcastId != null) {
            channel = new ch.Channel(channelId, broadcastId, null, null, {});
            this.channels[channelId.toString()] = channel;
        }
        if (!channel.broadcastId.equals(broadcastId)) {
            return;
        }
        channel.update(atom);
    }

    removeChannelByBroadcastId(broadcastId: GID) {
        putil.deleteIf2(this.channels,
            channel => channel.broadcastId.equals(broadcastId));
    }

    private removeChannel(channelId: GID) {
        putil.deleteIf2(this.channels,
            channel => channel.channelId.equals(channelId));
    }
}
