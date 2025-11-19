angular.module('attendanceApp')
.controller('RegisterController', function($scope, $location) {
  $scope.username = '';
  $scope.password = '';

  $scope.register = function() {
    const uname = ($scope.username || '').trim().toLowerCase();
    const pwd = ($scope.password || '').trim();

    if (!uname || !pwd) {
      alert("Enter username & password");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users") || "{}");

    if (users[uname]) {
      alert("User already exists");
      return;
    }

    users[uname] = { password: pwd };
    localStorage.setItem("users", JSON.stringify(users));
    alert("Registered successfully! You can login now.");
    $location.path("/login");
  };
});
