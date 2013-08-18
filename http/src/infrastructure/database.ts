var MongoClient = require('mongodb').MongoClient;
import ch = require('./../domain/entity/channel');
var log4js = require('log4js');

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
            db.collection('doneChannels', (err, collection) => {
                var old = new Date();
                old.setDate(old.getDate() - 1);
                collection.findAndRemove({ end: { $lt: old } }, (err, line) => {// ‚Â‚¢‚Å‚ÉŒÃ‚¢‚à‚Ì‚ðíœ
                    if (err != null) {
                        logger.error(err);
                    }
                    if (line > 0) {
                        logger.info(line + ' doneChannel(s) deleted.');
                    }
                }); // delete‚Í•À—ñŽÀs
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
    MongoClient.connect('mongodb://'
        + (process.env.OPENSHIFT_MONGODB_DB_USERNAME != null
        ? process.env.OPENSHIFT_MONGODB_DB_USERNAME + ':'
        + process.env.OPENSHIFT_MONGODB_DB_PASSWORD + '@'
        : '')
        + (process.env.OPENSHIFT_MONGODB_DB_HOST || 'localhost') + ':'
        + (process.env.OPENSHIFT_MONGODB_DB_PORT || '27017') + '/'
        + 'dp', callback);
}
