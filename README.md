Developer's YP
============

[![Build Status](https://travis-ci.org/progre/developersyp.svg?branch=master)](https://travis-ci.org/progre/developersyp)

http://dp.prgrssv.net


Require
----

* node and npm
* grunt-cli


How to build & run
----

1. run `> init.bat` (Windows) or `$ ./init.sh` (Mac, Linux)
2. run `> npm install` on pcp/
3. run `> grunt` on pcp/
4. open other console, and run `> npm install` on http/
5. run `> grunt` on http/


サーバー構成
----

### pcp server

PeerCastと通信を行うサーバーです。


### http server

Webブラウザやpcypツールと通信を行うサーバーです。


### mongo db

http serverの配信履歴を保存する為に必要です。
別途ご用意ください。


起動オプション
----

### pcp server

pcpディレクトリで実行します。
```bat
> node app/server [pcp-port] [http-port]
```

* pcp-port: PeerCastからの通信を待ち受けるTCPポート番号 (default: 7146)
* http-port: httpサーバーからの通信を待ち受けるTCPポート番号 (default: 7180)


### http server

httpディレクトリで実行します。
```bat
> node app/server [local-ip] [pcp-ip] [mongodb-ip]
```

* local-ip: Webブラウザ、pcypツールからの通信を待ち受ける「IPアドレス:TCPポート番号」 (default: 0.0.0.0:8080)
* pcp-ip: pcpサーバーの「IPアドレス:ポート番号」 (default: 127.0.0.1:7180)
* mongodb-ip: mongodbの「ユーザー:パスワード@IP:ポート番号/db名」 (default: 127.0.0.1:27017)


License
----

MIT License
