import pcp = require('./pcp');
import GID = require('./gid');

export class Channel {
    constructor(
        public channel_id: GID,
        public broadcast_id: GID,
        public info: pcp.Atom,
        public track: pcp.Atom,
        public hosts: { [sessionId: string]: Host }) {
    }

    /** infoとtrackを引数のatomが持つinfo, trackで更新する */
    update(atom: pcp.Atom) {
        var info: pcp.Atom = atom.get(pcp.CHAN_INFO);
        if (info != null) {
            if (this.info != null)
                this.info.update(info);
            else
                this.info = info;
        }
        var track = atom.get(pcp.CHAN_TRACK);
        if (track != null) {
            if (this.track != null)
                this.track.update(track);
            else
                this.track = track;
        }
    }

    putHost(sessionId: GID, host: Host, atom: pcp.Atom) {
        this.hosts[sessionId.toString()] = host;
        this.hosts[sessionId.toString()].vp_version = atom.get(pcp.HOST_VERSION_VP);
        this.hosts[sessionId.toString()].info = atom;
    }
}

export class Host {
    constructor(
        public session_id?: GID,
        public broadcast_id?: GID,
        public agent?: string,
        public ip?: string,
        public port?: number,
        public version?: number,
        public vp_version?: number,
        public info?: pcp.Atom) {
    }
}
