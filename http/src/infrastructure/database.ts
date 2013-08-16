var MongoClient = require('mongodb').MongoClient;
import ch = require('./../domain/entity/channel');

export module doneChannels {
    export function toArray(
        callback: (doneChannels: ch.DoneChannel[]) => void ): void {
        connect((err, db) => {
            if (err != null) {
                console.error(err);
                callback(null);
                return;
            }
            db.collection('doneChannels', (err, collection) => {
                if (err != null)
                    console.error(err);
                collection.find().toArray((err, doneChannels: ch.DoneChannel[]) => {
                    if (err != null)
                        console.error(err);
                    db.close(true);
                    callback(doneChannels);;
                });
            });
        });
    }

    export function add(channel: ch.DoneChannel) {
        connect((err, db) => {
            db.collection('done_channels', (err, collection) => {
                collection.insert(channel);
                db.close(true);
            });
        });
    }
};

function connect(callback: (err, db) => void ) {
    MongoClient.connect('mongodb://'
        + (process.env.OPENSHIFT_MONGODB_DB_HOST || 'localhost') + ':'
        + (process.env.OPENSHIFT_MONGODB_DB_PORT || '27017') + '/'
        + 'dp', callback);
}
