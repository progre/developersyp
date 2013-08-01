import putil = require('./util');

/** 16バイトのデータ */
export = GID;
class GID {
    constructor(private _id: NodeBuffer) {
        // 元のコードではバイナリ文字列で保持している
    }

    get id() {
        return this._id;
    }

    toString() {
        var data = '';
        for (var i = 0; i < 16; i++) {
            data += putil.padLeft(this._id.readUInt8(i).toString(16).toUpperCase(), 2, '0');
        }
        return data;
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
        if (x.id.length !== 16) return false;
        for (var i = 0; i < 16; i++) {
            if (this._id[i] !== x.id[i]) return false;
        }
        return true;
    }
}
