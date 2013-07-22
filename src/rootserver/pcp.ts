// Copyright(C) 2013 progre (djyayutto@gmail.com)
// 
// This program is free software: you can redistribute it and / or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program.If not, see <http://www.gnu.org/licenses/>.

/// <reference path='../DefinitelyTyped/node/node.d.ts'/>

var HELO = 'helo';
var HELO_AGENT = 'agnt';
var HELO_OSTYPE = 'ostp';
var HELO_SESSIONID = 'sid';
var HELO_PORT = 'port';
var HELO_PING = 'ping';
var HELO_PONG = 'pong';
var HELO_REMOTEIP = 'rip';
var HELO_VERSION = 'ver';
var HELO_BCID = 'bcid';
var HELO_DISABLE = 'dis';
var OLEH = 'oleh';
var OK = 'ok';

var CHAN = 'chan';
var CHAN_ID = 'id';
var CHAN_BCID = 'bcid';
var CHAN_PKT = 'pkt';
var CHAN_PKT_TYPE = 'type';
var CHAN_PKT_HEAD = 'head';
var CHAN_PKT_META = 'meta';
var CHAN_PKT_POS = 'pos';
var CHAN_PKT_DATA = 'data';
var CHAN_INFO = 'info';
var CHAN_INFO_TYPE = 'type';
var CHAN_INFO_BITRATE = 'bitr';
var CHAN_INFO_GENRE = 'gnre';
var CHAN_INFO_NAME = 'name';
var CHAN_INFO_URL = 'url';
var CHAN_INFO_DESC = 'desc';
var CHAN_INFO_COMMENT = 'cmnt';
var CHAN_INFO_PPFLAGS = 'pflg';
var CHAN_TRACK = 'trck';
var CHAN_TRACK_TITLE = 'titl';
var CHAN_TRACK_CREATOR = 'crea';
var CHAN_TRACK_URL = 'url';
var CHAN_TRACK_ALBUM = 'albm';

var BCST = 'bcst';
var BCST_TTL = 'ttl';
var BCST_HOPS = 'hops';
var BCST_FROM = 'from';
var BCST_DEST = 'dest';
var BCST_GROUP = 'grp';
var BCST_GROUP_ALL = 0xff;
var BCST_GROUP_ROOT = 1;
var BCST_GROUP_TRACKERS = 2;
var BCST_GROUP_RELAYS = 4;
var BCST_CHANID = 'cid';
var BCST_VERSION = 'vers';
var BCST_VERSION_VP = 'vrvp';
var BCST_VERSION_EX_PREFIX = 'vexp';
var BCST_VERSION_EX_NUMBER = 'vexn';
var HOST = 'host';
var HOST_ID = 'id';
var HOST_IP = 'ip';
var HOST_PORT = 'port';
var HOST_CHANID = 'cid';
var HOST_NUML = 'numl';
var HOST_NUMR = 'numr';
var HOST_UPTIME = 'uptm';
var HOST_TRACKER = 'trkr';
var HOST_VERSION = 'ver';
var HOST_VERSION_VP = 'vevp';
var HOST_VERSION_EX_PREFIX = 'vexp';
var HOST_VERSION_EX_NUMBER = 'vexn';
var HOST_CLAP_PP = 'clap';
var HOST_OLDPOS = 'oldp';
var HOST_NEWPOS = 'newp';
var HOST_FLAGS1 = 'flg1';
var HOST_FLAGS1_TRACKER = 0x01;
var HOST_FLAGS1_RELAY = 0x02;
var HOST_FLAGS1_DIRECT = 0x04;
var HOST_FLAGS1_PUSH = 0x08;
var HOST_FLAGS1_RECV = 0x10;
var HOST_FLAGS1_CIN = 0x20;
var HOST_FLAGS1_PRIVATE = 0x40;
var HOST_UPHOST_IP = 'upip';
var HOST_UPHOST_PORT = 'uppt';
var HOST_UPHOST_HOPS = 'uphp';

var ROOT = 'root';
var ROOT_UPDINT = 'uint';
var ROOT_CHECKVER = 'chkv';
var ROOT_URL = 'url';
var ROOT_UPDATE = 'upd';
var ROOT_NEXT = 'next';

var QUIT = 'quit';
var ERROR_QUIT = 1000;
var ERROR_BCST = 2000;
var ERROR_READ = 3000;
var ERROR_WRITE = 4000;
var ERROR_GENERAL = 5000;

var ERROR_SKIP = 1;
var ERROR_ALREADYCONNECTED = 2;
var ERROR_UNAVAILABLE = 3;
var ERROR_LOOPBACK = 4;
var ERROR_NOTIDENTIFIED = 5;
var ERROR_BADRESPONSE = 6;
var ERROR_BADAGENT = 7;
var ERROR_OFFAIR = 8;
var ERROR_SHUTDOWN = 9;
var ERROR_NOROOT = 10;
var ERROR_BANNED = 11;

/** 16バイトのデータ */
export class GID {
    constructor(private _id: NodeBuffer) {
        // 元のコードではバイナリ文字列で保持している
    }

    get id() {
        return this._id;
    }

    to_s() {
        var data = '';
        for (var i = 0; i < 4; i++) {
            data += ('00000000' + this._id.readUInt32LE(i * 4).toString(16)).slice(-8);
        }
        return data;
    }

    static from_string(str: string) {
        if (str.length != 32) {
            throw new Error('文字列の長さが異常');
        }
        var id = new Buffer(16);
        for (var i = 0; i < 4; i++) {
            var begin = i * 8;
            id.writeUInt32LE(parseInt(str.slice(begin, begin + 8), 16), i * 4);
        }
        return new GID(id);
    }

    static generate() {
        var id = new Buffer(16);
        for (var i = 0; i < 4; i++) {
            id.writeUInt32LE(Math.floor(Math.random() * 4294967295), i * 4);
        }
        return new GID(id);
    }

    equals(x: any) {
        if (x == null) return false;
        if (x.id == null) return false;
        if (x.id.length !== 4) return false;
        for (var i = 0; i < 4; i++) {
            if (this._id[i] !== x.id[i]) return false;
        }
        return true;
    }
}

export class Atom {
    constructor(
        private name: string,
        private children: Atom[] = [],
        private content: NodeBuffer = null) {
    }

    static PacketType: { [key: string]: string } = {};

    static constructor() {
        Atom.PacketType[HELO] = 'parent';
        Atom.PacketType[OLEH] = 'parent';
        Atom.PacketType[CHAN] = 'parent';
        Atom.PacketType[CHAN_PKT] = 'parent';
        Atom.PacketType[CHAN_INFO] = 'parent';
        Atom.PacketType[CHAN_TRACK] = 'parent';
        Atom.PacketType[BCST] = 'parent';
        Atom.PacketType[HOST] = 'parent';
        Atom.PacketType[HELO_AGENT] = 'string';
        Atom.PacketType[HELO_SESSIONID] = 'gid';
        Atom.PacketType[HELO_PORT] = 'short';
        Atom.PacketType[HELO_PING] = 'short';
        Atom.PacketType[HELO_REMOTEIP] = 'ip';
        Atom.PacketType[HELO_VERSION] = 'int';
        Atom.PacketType[HELO_BCID] = 'gid';
        Atom.PacketType[HELO_DISABLE] = 'int';
        Atom.PacketType[OK] = 'int';
        Atom.PacketType[CHAN_ID] = 'gid';
        Atom.PacketType[CHAN_BCID] = 'gid';
        Atom.PacketType[CHAN_PKT_TYPE] = 'bytes';
        Atom.PacketType[CHAN_PKT_POS] = 'int';
        Atom.PacketType[CHAN_PKT_DATA] = 'bytes';
        Atom.PacketType[CHAN_INFO_TYPE] = 'bytes';
        Atom.PacketType[CHAN_INFO_BITRATE] = 'int';
        Atom.PacketType[CHAN_INFO_GENRE] = 'string';
        Atom.PacketType[CHAN_INFO_NAME] = 'string';
        Atom.PacketType[CHAN_INFO_URL] = 'string';
        Atom.PacketType[CHAN_INFO_DESC] = 'string';
        Atom.PacketType[CHAN_INFO_COMMENT] = 'string';
        Atom.PacketType[CHAN_INFO_PPFLAGS] = 'int';
        Atom.PacketType[CHAN_TRACK_TITLE] = 'string';
        Atom.PacketType[CHAN_TRACK_CREATOR] = 'string';
        Atom.PacketType[CHAN_TRACK_URL] = 'string';
        Atom.PacketType[CHAN_TRACK_ALBUM] = 'string';
        Atom.PacketType[BCST_TTL] = 'byte';
        Atom.PacketType[BCST_HOPS] = 'byte';
        Atom.PacketType[BCST_FROM] = 'gid';
        Atom.PacketType[BCST_DEST] = 'gid';
        Atom.PacketType[BCST_GROUP] = 'byte';
        Atom.PacketType[BCST_CHANID] = 'gid';
        Atom.PacketType[BCST_VERSION] = 'int';
        Atom.PacketType[BCST_VERSION_VP] = 'int';
        Atom.PacketType[HOST_ID] = 'gid';
        Atom.PacketType[HOST_IP] = 'ip';
        Atom.PacketType[HOST_PORT] = 'short';
        Atom.PacketType[HOST_CHANID] = 'gid';
        Atom.PacketType[HOST_NUML] = 'int';
        Atom.PacketType[HOST_NUMR] = 'int';
        Atom.PacketType[HOST_UPTIME] = 'int';
        Atom.PacketType[HOST_VERSION] = 'int';
        Atom.PacketType[HOST_VERSION_VP] = 'int';
        Atom.PacketType[HOST_CLAP_PP] = 'int';
        Atom.PacketType[HOST_OLDPOS] = 'int';
        Atom.PacketType[HOST_NEWPOS] = 'int';
        Atom.PacketType[HOST_FLAGS1] = 'byte';
        Atom.PacketType[HOST_UPHOST_IP] = 'ip';
        Atom.PacketType[HOST_UPHOST_PORT] = 'int';
        Atom.PacketType[HOST_UPHOST_HOPS] = 'int';
        Atom.PacketType[QUIT] = 'int';
        Atom.PacketType[ROOT] = 'parent';
        Atom.PacketType[ROOT_UPDINT] = 'int';
        Atom.PacketType[ROOT_NEXT] = 'int';
        Atom.PacketType[ROOT_CHECKVER] = 'int';
        Atom.PacketType[ROOT_URL] = 'string';
        Atom.PacketType[BCST_VERSION_EX_PREFIX] = 'bytes';
        Atom.PacketType[BCST_VERSION_EX_NUMBER] = 'short';
        Atom.PacketType[HOST_VERSION_EX_PREFIX] = 'bytes';
        Atom.PacketType[HOST_VERSION_EX_NUMBER] = 'short';
    }

    get value() {
        var type = Atom.PacketType[this.name];
        switch (type) {
            case null:
                return this.children != null ? <any>this : <any>this.content;
            case 'parent':
                return this;
            case 'byte':
                this.throwIfContentLength(1);
                return this.content.readUInt8(0);
            case 'gid':
                this.throwIfContentLength(16);
                return new GID(this.content);
            case 'int':
                this.throwIfContentLength(4);
                return this.content.readUInt32LE(0);
            case 'ip':
                this.throwIfContentLength(4);
                return [
                    this.content.readUInt8(3),
                    this.content.readUInt8(2),
                    this.content.readUInt8(1),
                    this.content.readUInt8(0)
                ];
            case 'short':
                this.throwIfContentLength(2);
                return this.content.readUInt16LE(0);
            case 'string':
                if (this.content.readUInt8(this.content.length - 1) !== 0)
                    throw new Error('String must ends with null byte');
                return this.content;// 文字列にすべきかもしれないが、元のソースはエンコード未指定文字列で返してるっぽい
            case 'bytes':
                return this.content;
            default:
                throw new Error('Unknown type: ' + type);
        }
    }

    set value(v) {
        var type = Atom.PacketType[this.name];
        switch (type) {
            case null:
                if (Array.isArray(v))
                    this.children = v;
                else
                    this.content = <NodeBuffer>v;
                break;
            case 'parent':
                this.children = v;
                break;
            case 'byte':
                this.content = new Buffer(1);
                this.content.writeUInt8(<number>v, 0);
                break;
            case 'gid':
                if (v.id != null) // instance of GID?
                    this.content = v.id;
                // else if  System::Guid
                else
                    this.content = v;
                break;
            case 'int':
                this.content = new Buffer(4);
                this.content.writeUInt32LE(<number>v, 0);
                break;
            case 'ip':
                if (Array.isArray(v)) {
                    this.writeIp(<number[]>v);
                } else if (typeof v === 'string') {
                    var str = <string>v;
                    this.writeIp(str.split('.').map(x => parseInt(x)));
                } // else if System::Net::IPAddress
                break;
            case 'short':
                this.content = new Buffer(2);
                this.content.writeUInt16LE(<number>v, 0);
                break;
            case 'string':
                this.content = new Buffer((<string>v).length + 1);
                this.content.write(<string>v);
                this.content.writeUInt8(0, this.content.length - 1);
                break;
            case 'bytes':
                this.content = new Buffer((<string>v).length);
                this.content.write(<string>v);
                break;
            default:
                throw new Error('Unknown type: ' + type);
        }
    }

    get(name: string) { // インデクサ
        var children = this.children.filter(c => c.name === name);
        switch (children.length) {
            case 0:
                return null;
            case 1:
                return children[0].value;
            default:
                return children.map(c => c.value);
        }
    }

    put(name: string, value) { // インデクサ
        deleteIf(this.children, (c: Atom) => c.name === name);
        var atom = new Atom(name);
        atom.value = value;
        this.children.push(atom);
        return value;
    }

    /** 引数の子データを自分の子にputする */
    update(atom: Atom) {
        atom.children.forEach(c => {
            this.put(c.name, c.value);
        });
    }

    write(stream: NodeBuffer) {
        // TODO: streamが具体的にどういう型が許されるかによる
        if (this.children != null && this.children.length > 0) {
            
        }
    }

    static read_blocking(stream, sz: number) {
        // TODO: streamが具体的にどういう型が許されるかによる
    }

    static read(stream) {
        // TODO: streamが具体的にどういう型が許されるかによる
    }

    private writeIp(ip: number[]) {
        var array = ip.reverse();
        this.content = new Buffer(array.length);
        for (var i = 0, len = array.length; i < len; i++) {
            this.content.writeInt8(i, array[i]);
        }
    }

    private throwIfContentLength(length: number) {
        if (this.content.length !== length)
            throw new Error(
                'Invalid content length ' + this.content.length + ' for ' + length);
    }
}

function deleteIf(array: Atom[], filter: (Atom) => boolean) {
    array.filter(filter).forEach(del => {
        array.splice(array.indexOf(del), 1);
    });
}
