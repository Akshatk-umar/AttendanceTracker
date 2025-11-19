angular.module('attendanceApp')
.controller('LoginController', function($scope, $location) {
  $scope.login = function() {
    const uname = $scope.username?.trim().toLowerCase();
    const pwd = $scope.password?.trim();
    const users = JSON.parse(localStorage.getItem("users") || "{}");

    if (uname === "admin" && pwd === "admin") {
      localStorage.setItem("loggedInUser", "admin");
      $location.path("/admin");
      return;
    }

    if (!users[uname]) {
      alert("User not found");
      return;
    }

    if (users[uname].password !== pwd) {
      alert("Invalid password");
      return;
    }

    localStorage.setItem("loggedInUser", uname);
    $location.path("/attendance");
  };
});
