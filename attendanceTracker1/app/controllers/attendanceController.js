angular.module('attendanceApp')
.controller('AttendanceController', function($scope, $location, $timeout) {
  const rawUsername = localStorage.getItem("loggedInUser");

  if (!rawUsername || rawUsername === "admin") {
    $location.path("/login");
    return;
  }

  $scope.username = rawUsername.toLowerCase();
  $scope.today = getDateStr(new Date());
  $scope.selectedDate = new Date($scope.today);

  $scope.selectedMonth = new Date();
  $scope.leaveForm = {};
  $scope.showLeaveModal = false;
  $scope.leaveHistory = [];
  $scope.last7Days = [];
  $scope.todayRecord = {};
  $scope.dailyRecord = {};
  $scope.monthStats = { total: 0, present: 0, percent: 0 };
  let attendanceChart;

  $scope.initAttendance = function() {
    $timeout(() => {
      $scope.viewTodayAttendance();
      $scope.viewDailyAttendance();
      $scope.viewLast7Days();
      $scope.updateMonthAttendance();
      $scope.renderLeaveHistory();
    }, 0);
  };

  $scope.sidebarOpen = false;

  $scope.toggleSidebar = function() {
    $scope.sidebarOpen = !$scope.sidebarOpen;
  };

  $scope.navigateToLeaveHistory = function() {
    var section = document.getElementById('leaveHistorySection');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
     $scope.sidebarOpen = false;
};

  $scope.logout = function() {
    localStorage.removeItem("loggedInUser");
    $location.path("/login");
  };

  function getDateStr(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  $scope.checkIn = function() {
    const records = JSON.parse(localStorage.getItem("attendance") || "{}");
    const today = $scope.today;
    if (!records[today]) records[today] = {};
    if (!records[today][$scope.username]) records[today][$scope.username] = {};
    if (records[today][$scope.username].checkIn) return alert("Already checked in");

    records[today][$scope.username].checkIn = new Date().toLocaleTimeString();
    localStorage.setItem("attendance", JSON.stringify(records));
    $scope.viewTodayAttendance();
    $scope.viewLast7Days();
    $scope.updateMonthAttendance();
  };

  $scope.checkOut = function() {
    const records = JSON.parse(localStorage.getItem("attendance") || "{}");
    const today = $scope.today;
    if (!records[today]?.[$scope.username]?.checkIn) return alert("Check in first");

    records[today][$scope.username].checkOut = new Date().toLocaleTimeString();
    localStorage.setItem("attendance", JSON.stringify(records));
    $scope.viewTodayAttendance();
    $scope.viewLast7Days();
    $scope.updateMonthAttendance();
  };

  $scope.startBreak = function() {
    const records = JSON.parse(localStorage.getItem("attendance") || "{}");
    const today = $scope.today;
    if (!records[today]?.[$scope.username]?.checkIn) return alert("Check in first");
    if (records[today][$scope.username].breakStart) return alert("Break already started");

    records[today][$scope.username].breakStart = new Date().toLocaleTimeString();
    localStorage.setItem("attendance", JSON.stringify(records));
    $scope.viewTodayAttendance();
    $scope.viewLast7Days();
  };

  $scope.endBreak = function() {
    const records = JSON.parse(localStorage.getItem("attendance") || "{}");
    const today = $scope.today;
    if (!records[today]?.[$scope.username]?.breakStart) return alert("Start break first");
    if (records[today][$scope.username].breakEnd) return alert("Break already ended");

    records[today][$scope.username].breakEnd = new Date().toLocaleTimeString();
    localStorage.setItem("attendance", JSON.stringify(records));
    $scope.viewTodayAttendance();
    $scope.viewLast7Days();
  };

  $scope.viewTodayAttendance = function() {
    const records = JSON.parse(localStorage.getItem("attendance") || "{}");
    $scope.todayRecord = records[$scope.today]?.[$scope.username] || {};
  };

  $scope.viewDailyAttendance = function() {
    const records = JSON.parse(localStorage.getItem("attendance") || "{}");

    if (!$scope.selectedDate) {
      $scope.dailyRecord = {};
      return;
    }

    const localDate = new Date($scope.selectedDate).toISOString().split("T")[0];
    $scope.dailyRecord = records[localDate]?.[$scope.username] || {};
  };

  $scope.viewLast7Days = function() {
    const records = JSON.parse(localStorage.getItem("attendance") || "{}");
    $scope.last7Days = [];

    for (let i = 0; i < 7; i++) {
      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() - i);
      const dateStr = getDateStr(dateObj);
      const rec = records[dateStr]?.[$scope.username] || {};
      $scope.last7Days.push({ date: dateStr, ...rec });
    }
  };
$scope.updateMonthAttendance = function() {
  const records = JSON.parse(localStorage.getItem("attendance") || "{}");

  let monthStr;
  if ($scope.selectedMonth instanceof Date) {
    monthStr = $scope.selectedMonth.toISOString().slice(0, 7); // "YYYY-MM"
  } else if (typeof $scope.selectedMonth === "string") {
    monthStr = $scope.selectedMonth;
  } else {
    monthStr = getDateStr(new Date()).slice(0, 7); // fallback to current month
  }

  const [year, monthNum] = monthStr.split("-").map(Number);
  const today = new Date();
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  let total = 0, present = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthNum - 1, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    if (year === today.getFullYear() && monthNum === (today.getMonth() + 1) && day > today.getDate()) break;

    const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    total++;
    if (records[dateStr]?.[$scope.username]?.checkIn) present++;
  }

  const percent = total ? Math.round((present / total) * 100) : 0;
  $scope.monthStats = { total, present, percent };

  const ctx = document.getElementById("attendanceChart")?.getContext("2d");
  if (!ctx) return;
  if (attendanceChart) attendanceChart.destroy();

console.log("selectedMonth raw:", $scope.selectedMonth);


  attendanceChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Present", "Absent"],
      datasets: [{
        data: [present, total - present],
        backgroundColor: ["#4CAF50", "#f44336"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: { display: true, text: `Attendance for ${monthStr}` }
      }
    }
  });
};

  $scope.openLeaveModal = function() {
    $scope.leaveForm = {};
    $scope.showLeaveModal = true;
  };

  $scope.closeLeaveModal = function() {
    $scope.showLeaveModal = false;
  };

  $scope.submitLeaveForm = function() {
    const leaveData = JSON.parse(localStorage.getItem("leaveApplications") || "{}");
    if (!leaveData[$scope.username]) leaveData[$scope.username] = [];

    const formatDate = d => new Date(d).toISOString().split("T")[0];

    leaveData[$scope.username].push({
      leaveType: $scope.leaveForm.leaveType,
      fromDate: formatDate($scope.leaveForm.fromDate),
      toDate: formatDate($scope.leaveForm.toDate),
      reason: $scope.leaveForm.reason,
      description: $scope.leaveForm.description,
      status: "Pending",
      submittedAt: new Date().toLocaleString()
    });

    localStorage.setItem("leaveApplications", JSON.stringify(leaveData));
    $scope.closeLeaveModal();
    $scope.renderLeaveHistory();
  };

  $scope.renderLeaveHistory = function() {
    const leaveData = JSON.parse(localStorage.getItem("leaveApplications") || "{}");
    $scope.leaveHistory = leaveData[$scope.username] || [];
  };

  $scope.deleteLeave = function(index) {
    if (!confirm("Are you sure you want to delete this leave request?")) return;
    const leaveData = JSON.parse(localStorage.getItem("leaveApplications") || "{}");
    leaveData[$scope.username].splice(index, 1);
    localStorage.setItem("leaveApplications", JSON.stringify(leaveData));
    $scope.renderLeaveHistory();
  };

  $scope.editLeave = function(index) {
    const leaveData = JSON.parse(localStorage.getItem("leaveApplications") || "{}");
    const leave = leaveData[$scope.username]?.[index];
    if (!leave) return;

    $scope.leaveForm = { ...leave };
    $scope.showLeaveModal = true;
  };
});
