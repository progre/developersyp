import net = require('net');
import log4js = require('log4js');
import pcp = require('./pcp');
import ch = require('./channel');
import rdr = require('./pcpreader');
import GID = require('./gid');
import root = require('./rootserver');

var AGENT_NAME = 'DP';

export = PcpServerSocket;
class PcpServerSocket {
    private ip: string;
    private pcpReader = new rdr.PcpReader();
    private state = ServerState.WAIT_HELO;
    private host: ch.Host;

    constructor(
        /** サーバー */
        private server: root.RootServer,
        /** 接続中のクライアント */
        private client: root.NodeSocket2,
        /** ログ */
        private logger: log4js.Logger
        ) {
        this.ip = client.remoteAddress + ':' + client.remotePort;
        logger.info('client connected. ' + this.ip);
        client.on('readable', () => {
            try {
                this.onReadable();
            } catch (e) {
                logger.error('uncaughtException: ' + (e.stack || e));
                client.destroy();
            }
        });
        client.on('error', (e: { code: string; errno: string; syscall: string }) => {
            this.logger.info('client error. ' + JSON.stringify(e));
        });
        client.on('end', () => {
            this.logger.info('client end. ' + this.ip);
        });
        client.on('close', () => {
            // 正常に通信していればここでremoveする必要はないはず
            if (this.host != null && this.host.broadcastId != null)
                this.server.removeChannelByBroadcastId(this.host.broadcastId);
            this.logger.info('client close. ' + this.ip);
        });
    }

    private onReadable() {
        try {
            var atom = this.pcpReader.read(this.client);
            if (atom == null)
                return;
            switch (this.state) {
                case ServerState.WAIT_HELO:
                    this.onHelo(atom);
                    break;
                case ServerState.WAIT_BCST:
                    this.onBcst(atom);
                    break;
                default:
                    throw new Error('Invalid state error.');
            }
        } catch (e) {
            // httpが来た時にここにくる
            throw e;
        }
    }

    private onHelo(atom: pcp.Atom) {
        if (atom.name !== pcp.HELO)
            throw new Error('Handshake failed');
        if (atom.get(pcp.HELO_PING) != null) {
            this.ping(
                atom.get(pcp.HELO_SESSIONID),
                this.client.remoteAddress,
                atom.get(pcp.HELO_PING),
                port => this.setHost(atom, port));
            return;
        }
        this.setHost(atom);
    }

    private setHost(atom: pcp.Atom, port?: number) {
        if (port == null)
            port = atom.get(pcp.HELO_PORT);
        this.host = new ch.Host(
            atom.get(pcp.HELO_SESSIONID),
            atom.get(pcp.HELO_BCID),
            atom.get(pcp.HELO_AGENT),
            this.client.remoteAddress,
            port,
            atom.get(pcp.HELO_VERSION));
        this.oleh();
        this.state = ServerState.WAIT_BCST;
    }

    /** クライアントのポート開放確認 */
    private ping(
        sessionId: GID, host: string, pingPort: number,
        callback: (port: number) => void ) {

        var subSocket: net.NodeSocket = <any>net.connect(pingPort, host, () => {
            var content = new Buffer(4);
            content.writeUInt32LE(1, 0);
            new pcp.Atom('pcp\n', null, content).writeTo(subSocket);
            var helo = new pcp.Atom(pcp.HELO, [], null);
            helo.put(pcp.HELO_SESSIONID, this.server.sessionId);
            helo.writeTo(subSocket);

            var reader = new rdr.AtomReader();
            subSocket.on('readable', () => {
                try {
                    var atom = reader.read(<any>subSocket);
                    if (atom == null)
                        return;
                    subSocket.end();
                    callback(sessionId.equals(atom.get(pcp.HELO_SESSIONID)) ? pingPort : 0);
                } catch (e) {
                    this.logger.error('[subSocket] uncaughtException: ' + (e.stack || e));
                    subSocket.destroy();
                }
            });
        });
        subSocket.setTimeout(5 * 1000, () => {
            this.logger.error('[subSocket] timeout.');
            subSocket.destroy();
            callback(0);
        });
    }

    /** olehコマンドをクライアントに送信する */
    private oleh() {
        var oleh = new pcp.Atom(pcp.OLEH, [], null);
        oleh.put(pcp.HELO_AGENT, AGENT_NAME);
        oleh.put(pcp.HELO_SESSIONID, this.server.sessionId);
        oleh.put(pcp.HELO_VERSION, 1218);
        oleh.put(pcp.HELO_REMOTEIP, this.client.remoteAddress);
        oleh.put(pcp.HELO_PORT, this.host.port); // .rbだとnilが入っていた？
        oleh.writeTo(this.client);
    }

    private onBcst(atom: pcp.Atom) {
        if (atom.name !== pcp.BCST)
            throw new Error('BCST failed. atom: ' + JSON.stringify(atom));
        atom.children.forEach(c => {
            switch (c.name) {
                case pcp.CHAN:
                    this.server.putChannel(atom, this.host.broadcastId);
                    break;
                case pcp.HOST:
                    this.server.putHost(this.host, atom);
                    break;
                case pcp.QUIT:
                    if (this.host != null && this.host.broadcastId != null)
                        this.server.removeChannelByBroadcastId(this.host.broadcastId);
                    break;
                case pcp.BCST_TTL:
                case pcp.BCST_HOPS:
                case pcp.BCST_FROM:
                case pcp.BCST_DEST:
                case pcp.BCST_GROUP:
                case pcp.BCST_CHANID:
                case pcp.BCST_VERSION:
                case pcp.BCST_VERSION_VP:
                case pcp.BCST_VERSION_EX_PREFIX:
                case pcp.BCST_VERSION_EX_NUMBER:
                    break;
                default:
                    this.logger.error(this.client.remoteAddress + ' | Unsupported type: ' + atom.name);
                    break;
            }
        });
    }
}

enum ServerState {
    WAIT_HELO, WAIT_BCST
}
