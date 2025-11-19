angular.module('attendanceApp', ['ngRoute'])

.config(function($routeProvider) {
  $routeProvider
    .when('/login', {
      templateUrl: 'app/views/login.html',
      controller: 'LoginController'
    })
    .when('/register', {
      templateUrl: 'app/views/register.html',
      controller: 'RegisterController'
    })
      .when('/admin', {
      templateUrl: 'app/views/admin.html',
      controller: 'AdminController'
    })
    .when('/attendance', {
  templateUrl: 'app/views/attendance.html',
  controller: 'AttendanceController'
    })
    .otherwise({
      redirectTo: '/login'
    });
});
