import http = require('http');
import ch = require('./../domain/entity/channel');

var ROOT_SERVER = 'http://root-dp.prgrssv.net:7180/snsbt_edimt6wfgkz_y4cmyr-zjru9s449_ybdw8wyt56c3nuggam8428jwm5269';

export function getIndexJsonAsync(callback: (channels: ch.Channel[]) => void ): void {
    var req = http.get(ROOT_SERVER, (proxyRes: http.ClientResponse) => {
        if (proxyRes.statusCode !== 200) {
            callback(null);
            return;
        }
        var body = '';
        proxyRes.setEncoding('utf-8');
        proxyRes.on('readable', () => {
            var data = (<any>proxyRes).read();
            if (data == null)
                return;
            body += data;
        });
        proxyRes.on('end', () => {
            callback(JSON.parse(body));
        });
    });
    req.setTimeout(10 * 1000, () => {
        callback(null);
    });
    req.on('error', e => {
        console.error("Got error: " + e.message);
        callback(null);
    });
}
