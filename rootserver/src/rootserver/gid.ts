/** 16バイトのデータ */
export = GID;
class GID {
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
        if (x.id.length !== 16) return false;
        for (var i = 0; i < 16; i++) {
            if (this._id[i] !== x.id[i]) return false;
        }
        return true;
    }
}
