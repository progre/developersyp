/// <reference path="../../typings/tsd.d.ts"/>
import putil = require('./common/util');
import env = require('./env');
declare var io;

var app = angular.module('app', ['ngRoute', 'ngCookies', 'ngAnimate']);
app.config(['$locationProvider', '$routeProvider',
    ($locationProvider: ng.ILocationProvider,
        $routeProvider: ng.route.IRouteProvider) => {
        $locationProvider.html5Mode(true);
        $routeProvider
            .when('/', {
                templateUrl: 'partials/index.html'
            }).when('/list.html', {
                controller: 'ListController',
                templateUrl: 'partials/list.html'
            }).when('/info.html', {
                templateUrl: 'partials/info.html'
            }).otherwise({
                templateUrl: 'partials/404.html'
            });
    }
]);
app.controller('ApplicationController', ['$scope', '$location',
    ($scope, $location) => {
        $scope.getClass = (path) =>
            $location.path().substr(0, path.length) === path ? 'active' : ''
    }]);
app.controller('ListController', ['$scope', '$location', '$http', '$cookieStore', '$sce',
    ($scope, $location, $http: ng.IHttpService, $cookieStore, $sce: any) => {
        var socket = io.connect('ws://' + env.serverIp + ':' + env.serverPort + '/');
        socket.emit('get', ['/channels', '/done-channels']);
        socket.on('post', data => {
            for (var key in data) switch (key) {
                case '/channels':
                    var channels = data[key].map(x => {
                        x['time'] = putil.secondsToHoursMinutes(x.host.uptime);
                        var tweetText = encodeURIComponent('PeerCast視聴中 ' + x.info.name
                            + ' [' + x.info.genre
                            + (x.info.genre.length > 0 && x.info.desc.length > 0 ? ' - ' : '')
                            + x.info.desc + ']「' + x.info.comment + '」');
                        x.tweetUrl = $sce.trustAsResourceUrl('http://platform.twitter.com/widgets/tweet_button.html#count=none&lang=ja&text=' + tweetText + '&url=http%3A%2F%2Fdp.prgrssv.net%2Flist.html&button_hashtag=peercast');
                        return x;
                    });
                    $scope.$apply(() => $scope.channels = channels);
                    break;
                case '/done-channels':
                    var doneChannels = data[key];
                    $scope.$apply(() => $scope.doneChannels = doneChannels);
                    break;
            }
        });

        $scope.port = $cookieStore.get('port') || 7144;
        $scope.$watch('port', () => $cookieStore.put('port', $scope.port));

        $scope.update = () => {
            $scope.channels = null;
            $scope.doneChannels = null;
            socket.emit('get', ['/channels', '/done-channels']);
        };
    }]);

angular.bootstrap(<any>document, ['app']);
