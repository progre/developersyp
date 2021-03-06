import ch = require('./../domain/entity/channel');
var MongoClient = require('mongodb').MongoClient;
var log4js = require('log4js');

export var address: string = '';

export module doneChannels {
    export function toArray(
        callback: (doneChannels: ch.DoneChannel[]) => void ): void {
        var logger = log4js.getLogger('app');
        connect((err, db) => {
            if (err != null) {
                logger.error(err);
                callback(null);
                return;
            }
            db.collection('doneChannels', (err, collection) => {
                if (err != null) {
                    logger.error(err);
                    callback(null);
                    return;
                }
                collection.find().sort({ end: -1 }).toArray((err, doneChannels: ch.DoneChannel[]) => {
                    if (err != null) {
                        logger.error(err);
                        callback(null);
                        return;
                    }
                    db.close(true);
                    callback(doneChannels);;
                });
            });
        });
    }

    export function add(channel: ch.DoneChannel) {
        var logger = log4js.getLogger('app');
        connect((err, db) => {
            if (err != null) {
                logger.error(err);
                return;
            }
            db.collection('doneChannels', (err, collection) => {
                var old = new Date();
                old.setDate(old.getDate() - 15);
                collection.findAndRemove({
                    end: { $lt: old }
                }, (err, line) => {// ついでに古いものを削除
                        if (err != null) {
                            logger.error(err);
                        }
                        if (line > 0) {
                            logger.info(line + ' doneChannel(s) deleted.');
                        }
                    }); // deleteは並列実行
                collection.findAndRemove({
                    'channel.id': channel.channel.id,
                    end: { $gt: channel.begin }// > grater than 配信開始より後の時間に終了しているチャンネル
                }, (err, line) => {// ネットワークトラブルとかで配信中にチャンネル終了扱いされちゃう場合に、直前の誤検出を削除する
                        if (err != null) {
                            logger.error(err);
                        }
                        if (line > 0) {
                            logger.info(line + ' doneChannel(s) deleted.');
                        }
                    }); // deleteは並列実行

                collection.insert(channel, err => {
                    if (err != null) {
                        logger.error(err);
                    }
                    db.close(true);
                });
            });
        });
    }
};

function connect(callback: (err, db) => void ) {
    MongoClient.connect('mongodb://' + address, callback);
}
