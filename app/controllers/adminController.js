angular.module('attendanceApp').controller('AdminController', function($scope, $location) {

  let adminChart;

  $scope.initAdmin = function() {
    const username = localStorage.getItem("loggedInUser");
    if (username !== "admin") {
      $location.path("/login");
      return;
    }

    const todayStr = getLocalDateStr();
  $scope.selectedDate = moment().toDate(); // ensures it's a Date object

    document.getElementById("adminDateSelector").max = todayStr;

    $scope.loadLeaveRequests();
    $scope.loadLeaveHistory();

    $scope.loadAttendanceByDate();
    $scope.renderStaffPresenceChart();
     $scope.renderAttendanceTrendChart();

  };
  $scope.sidebarOpen = false;

    $scope.toggleSidebar = function() {
  $scope.sidebarOpen = !$scope.sidebarOpen;
};
    $scope.navigateToLeaveHistory = function() {
     var section = document.getElementById('leaveHistorySection');
     if (section) {
     section.scrollIntoView({ behavior: 'smooth' });

    // jQuery highlight effect
      $(section).css('background-color', 'rgba(169,169,169, 0.5)');
     setTimeout(() => $(section).css('background-color', ''), 1000);
  }
  $scope.sidebarOpen = false;
};

$scope.updateGroupedLeaveHistory = function() {
  $scope.groupedLeaveHistoryData = _.groupBy($scope.leaveHistory, 'status');
};





    $scope.groupedLeaveHistory = function() {
  const grouped = _.groupBy($scope.leaveHistory, 'status');
  console.log("Grouped Leave History:", grouped);
  return grouped;
};
$scope.renderAttendanceTrendChart = function() {
  const attendance = JSON.parse(localStorage.getItem("attendance") || "{}");
  const users = Object.keys(JSON.parse(localStorage.getItem("users") || "{}"));

  const today = new Date();
  const dateLabels = [];
  const presentCounts = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateStr(d);
    dateLabels.push(dateStr);

    const dayData = attendance[dateStr] || {};
    let present = 0;

    users.forEach(user => {
      if (dayData[user]?.checkIn) present++;
    });

    presentCounts.push(present);
  }

  Highcharts.chart('attendanceTrendChart', {
    chart: { type: 'line' },
    title: { text: 'Attendance Over Last 7 Days' },
    xAxis: { categories: dateLabels },
    yAxis: {
      title: { text: 'Present Count' },
      allowDecimals: false
    },
    series: [{
      name: 'Present',
      data: presentCounts,
      color: '#4CAF50'
    }],
    credits: { enabled: false }
  });
};


  $scope.logout = function() {
    localStorage.removeItem("loggedInUser");
    $location.path("/login");
  };

function getLocalDateStr(date = new Date()) {
  return moment(date).format("YYYY-MM-DD");
}


$scope.renderStaffPresenceChart = function() {
  const today = getLocalDateStr();
  $scope.today = today; // ensure $scope.today is set
  const attendance = JSON.parse(localStorage.getItem("attendance") || "{}");
  const todayData = attendance[today] || {};
  const users = Object.keys(JSON.parse(localStorage.getItem("users") || "{}"));

  let present = 0, absent = 0;
  $scope.staffStatus = [];

  users.forEach(user => {
    const isPresent = todayData[user]?.checkIn;
    $scope.staffStatus.push({ name: user, status: isPresent ? 'Present' : 'Absent' });
    if (isPresent) present++;
    else absent++;
  });

  // Chart.js rendering
  const ctx = document.getElementById("staffPresenceChart")?.getContext("2d");
  if (!ctx) return;
  if (adminChart) adminChart.destroy();

  adminChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Present", "Absent"],
      datasets: [{
        data: [present, absent],
        backgroundColor: ["#4CAF50", "#f44336"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: { display: true, text: `Staff Presence on ${today}` }
      }
    }
  });

  // Handsontable rendering
  const hotData = $scope.staffStatus.map(s => [s.name, s.status]);

  if ($scope.staffTableInstance) {
    $scope.staffTableInstance.destroy();
  }

  const container = document.getElementById("staffTableContainer");
  if (!container) return;
$scope.staffTableInstance = new Handsontable(document.getElementById("staffTableContainer"), {
  data: hotData,
  colHeaders: ["User", "Status"],
  columns: [
    { type: "text" },
    {
      type: "dropdown",
      source: ["Present", "Absent"],
      allowInvalid: false
    }
  ],
  rowHeaders: true,
  licenseKey: "non-commercial-and-evaluation",
  afterChange: function(changes, source) {
    if (source === 'edit') {
      changes.forEach(([row, prop, oldVal, newVal]) => {
        const user = hotData[row][0];
        const updatedStatus = newVal;
        // Optional: Save to localStorage or trigger chart update
        console.log(`Status for ${user} changed to ${updatedStatus}`);
      });
    }
  }
});

};


  $scope.loadLeaveRequests = function() {
    const leaveData = JSON.parse(localStorage.getItem("leaveApplications") || "{}");
    $scope.pendingLeaves = [];

    Object.entries(leaveData).forEach(([user, requests]) => {
      requests.forEach((req, idx) => {
        if (req.status === "Pending") {
          $scope.pendingLeaves.push({ ...req, user, index: idx });
        }
      });
    });
  };

  $scope.approveLeave = function(user, index) {
    const leaveData = JSON.parse(localStorage.getItem("leaveApplications") || "{}");
    leaveData[user][index].status = "Approved";
    localStorage.setItem("leaveApplications", JSON.stringify(leaveData));
    $scope.loadLeaveRequests();
    $scope.loadLeaveHistory();
  };

  $scope.rejectLeave = function(user, index) {
    const leaveData = JSON.parse(localStorage.getItem("leaveApplications") || "{}");
    leaveData[user][index].status = "Rejected";
    localStorage.setItem("leaveApplications", JSON.stringify(leaveData));
    $scope.loadLeaveRequests();
    $scope.loadLeaveHistory();
  };

$scope.loadLeaveHistory = function() {
  const leaveData = JSON.parse(localStorage.getItem("leaveApplications") || "{}");
  $scope.leaveHistory = [];

  Object.entries(leaveData).forEach(([user, requests]) => {
    requests.forEach(req => {
      $scope.leaveHistory.push({ ...req, user });
    });
  });

  $scope.updateGroupedLeaveHistory(); // ✅ call here
};



  $scope.loadAttendanceByDate = function() {
   const dateStr = moment($scope.selectedDate).format("YYYY-MM-DD");

    const attendance = JSON.parse(localStorage.getItem("attendance") || "{}");
  const dayData = attendance[dateStr] || {};

    const users = Object.keys(JSON.parse(localStorage.getItem("users") || "{}"));

    $scope.attendanceByDate = users.map(user => ({
      user,
      ...dayData[user]
    }));
  };
});
