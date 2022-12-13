const app = angular.module('admin-app', ['ngRoute'])
app.config(function ($routeProvider, $locationProvider) {
  $routeProvider
    .when('/product', {
      templateUrl: '/admin/product/index.html',
      controller: 'productCtrl',
    })
    .when('/order', {
      templateUrl: '/admin/order/order_index.html',
      controller: 'orderCtrl',
    })
    .when('/authorize', {
      templateUrl: '/admin/auth/index.html',
      controller: 'authorize-ctrl',
    })
    .when('/unauthorized', {})
    .otherwise({
      templateUrl: '/admin/product/index.html',
      controller: 'productCtrl',
      // template: 'FPT Polytechnic Education',
    })
})
app.controller('admin-ctrl', function () {
  console.log('hello from ctrl')
})
