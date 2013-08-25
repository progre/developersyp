/// <reference path="../../DefinitelyTyped/angularjs/angular.d.ts"/>
import putil = require('./common/util');

var app = angular.module('app', ['ngCookies']);
app.config(<any>['$locationProvider', '$routeProvider',
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
        $http.get('/channels.json').success((data: any[]) =>
            $scope.channels = data.map(x => {
                x['time'] = putil.secondsToHoursMinutes(x.host.uptime);
                return x;
            }));
        $http.get('/done-channels.json').success(data =>
            $scope.doneChannels = data);
        $scope.port = $cookieStore.get('port') || 7144;
        $scope.$watch('port', () => $cookieStore.put('port', $scope.port));// ‘½•ª“®‚­‚Í‚¸
    }]);

angular.bootstrap(<any>document, ['app']);
