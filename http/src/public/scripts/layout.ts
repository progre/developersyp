/// <reference path="../../DefinitelyTyped/angularjs/angular.d.ts"/>
import putil = require('./common/util');
declare var io;

var app = angular.module('app', ['ngRoute', 'ngCookies', 'ngAnimate']);
app.config(['$locationProvider', '$routeProvider',
    ($locationProvider: ng.ILocationProvider,
        $routeProvider: ng.IRouteProvider) => {
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
app.controller('ListController', ['$scope', '$location', '$http', '$cookieStore',
    ($scope, $location, $http: ng.IHttpService, $cookieStore) => {
        var socket = io.connect('ws://dp.prgrssv.net:8000/');
        socket.on('/channels', (data: any[]) =>
            $scope.$apply(() => $scope.channels = data.map(x => {
                x['time'] = putil.secondsToHoursMinutes(x.host.uptime);
                return x;
            })));
        socket.on('/done-channels', data => {
            $scope.$apply(() => $scope.doneChannels = data);
        });

        $scope.port = $cookieStore.get('port') || 7144;
        $scope.$watch('port', () => $cookieStore.put('port', $scope.port));
    }]);

angular.bootstrap(<any>document, ['app']);
