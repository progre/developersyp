import putil = require('./../common/util');
import pcp = require('./pcp');

export class PcpReader {
    private header = {
        name: '',
        length: -1,
        version: -1
    };
    private atomReader: AtomReader;

    /** ヘッダーから読み進める
        ヘッダーの読み込み失敗時に先頭4バイトのバッファーを投げる
     */
    read(readable: ReadableStream): pcp.Atom {
        // ヘッダーのバリデーション
        if (putil.isEmpty(this.header.name)) {
            var buffer = readable.read(4);
            if (buffer == null)
                return null;
            this.header.name = buffer.toString('utf8');
            if (this.header.name !== 'pcp\n')
                throw this.header.name;
        }
        if (this.header.length < 0) {
            var buffer = readable.read(4);
            if (buffer == null)
                return null;
            this.header.length = buffer.readUInt32LE(0);
            if (this.header.length != 4)
                throw new Error('Length Error: ' + this.header.length);
        }
        if (this.header.version < 0) {
            var buffer = readable.read(4);
            if (buffer == null)
                return null;
            this.header.version = buffer.readUInt32LE(0);
            if (this.header.version !== 1)
                throw new Error('Unknown PCP Version');
        }

        if (this.atomReader == null) {
            this.atomReader = new AtomReader();
        }
        var atom = this.atomReader.read(readable);
        if (atom == null)
            return null;
        this.atomReader = null;
        return atom;
    }
}

export class AtomReader {
    private name: string;
    private length: number;
    private children: pcp.Atom[] = [];
    private content: NodeBuffer;
    private childCache: AtomReader;

    read(stream: ReadableStream): pcp.Atom {
        if (this.name == null) {
            var buffer = stream.read(8);
            if (buffer == null)
                return null;
            this.name = buffer.toString('utf-8', 0, 4).replace(/\u0000+$/, '');
            this.length = buffer.readUInt32LE(4); // 最上位ビット
            if (this.length < 0)
                throw new Error('Critical error.');
        }
        if ((this.length & 0x80000000) != 0) {
            this.content = null;
            if (!this.readChildren(stream, this.length & 0x7FFFFFFF))
                return null;
        } else {
            this.children = null;
            this.content = stream.read(this.length);
            if (this.content == null)
                return null;
        }
        return new pcp.Atom(this.name, this.children, this.content);
    }

    private readChildren(stream: ReadableStream, numChildren: number): boolean {
        for (var i = this.children.length; i < numChildren; i++) {
            if (this.childCache == null) {
                this.childCache = new AtomReader();
            }
            var child = this.childCache.read(stream);
            if (child == null)
                return false;
            this.children.push(child);
            this.childCache = null;
        }
        return true;
    }
}
