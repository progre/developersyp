import net = require('net');
import log4js = require('log4js');
import pcp = require('./pcp');
import ch = require('./channel');
import PcpReader = require('./pcpreader');
import GID = require('./gid');
import root = require('./rootserver');

var AGENT_NAME = 'DP';

export = PcpServerSocket;
class PcpServerSocket {
    private ip: string;
    private pcpReader: PcpReader = new PcpReader();
    private state = ServerState.WAIT_HELO;
    private host: ch.Host;

    constructor(
        private server: root.RootServer,
        private client: root.NodeSocket2,
        private logger: log4js.Logger
        ) {
        this.ip = client.remoteAddress + ':' + client.remotePort;
        logger.info('client connected. ' + this.ip);
        client.on('readable', () => {
            try {
                this.onReadable();
            } catch (e) {
                logger.error('uncaughtException: ' + e.stack || e);
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
            if (this.host != null && this.host.broadcast_id != null)
                this.server.removeChannel(this.host);
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
                    if (atom.name !== pcp.HELO)
                        throw new Error('Handshake failed');
                    this.oleh();
                    if (atom.get(pcp.HELO_PING) != null)
                        throw new Error('早くコードかけks');
                    this.host = new ch.Host(
                        atom.get(pcp.HELO_SESSIONID),
                        atom.get(pcp.HELO_BCID),
                        atom.get(pcp.HELO_AGENT),
                        this.client.remoteAddress,
                        atom.get(pcp.HELO_PORT),
                        atom.get(pcp.HELO_VERSION));
                    this.state = ServerState.WAIT_MAIN;
                    break;
                case ServerState.WAIT_MAIN:
                    this.process_atom(atom);
                    break;
                default:
                    throw new Error('Invalid state error.');
            }
        } catch (e) {
            // httpが来た時にここにくる
            throw e;
        }
    }

    /** olehコマンドをクライアントに送信する */
    private oleh() {
        var oleh = new pcp.Atom(pcp.OLEH, [], null);
        oleh.put(pcp.HELO_AGENT, AGENT_NAME);
        oleh.put(pcp.HELO_SESSIONID, this.server.sessionId);
        oleh.put(pcp.HELO_VERSION, 1218);
        oleh.put(pcp.HELO_REMOTEIP, this.client.remoteAddress);
        oleh.put(pcp.HELO_PORT, 7144); // .rbだとnilが入っていた？
        oleh.writeTo(this.client);
    }

    private process_atom(atom: pcp.Atom) {
        switch (atom.name) {
            case pcp.BCST:
                this.on_bcst(atom);
                break;
            case pcp.HOST:
                if ((atom.get(pcp.HOST_FLAGS1) & pcp.HOST_FLAGS1_RECV) === 0)
                    this.server.removeChannel(atom.get(pcp.HOST_CHANID));
                this.server.putHost(this.host, atom);
                break;
            case pcp.CHAN:
                this.server.addChannel(this.host, atom);
                break;
            case pcp.QUIT:
                if (this.host != null && this.host.broadcast_id != null)
                    this.server.removeChannel(this.host);
                break;
            default:
                this.logger.error(this.client.remoteAddress + ' | Unsupported type: ' + atom.name);
                break;
        }
    }

    private on_bcst(atom: pcp.Atom) {
        atom.children.forEach(c => {
            switch (c.name) {
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
                    this.process_atom(c);
                    break;
            }
        });
    }
}

enum ServerState {
    WAIT_HELO, WAIT_MAIN
}
