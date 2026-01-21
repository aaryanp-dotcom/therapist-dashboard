// Supabase Configuration
var supabaseUrl = "https://hviqxpfnvjsqbdjfbttm.supabase.co";
var supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";
var client = supabase.createClient(supabaseUrl, supabaseKey);

// Check authentication and load dashboard
function loadDashboard() {
  client.auth.getSession().then(function(response) {
    if (!response.data.session) {
      window.location.href = "login.html";
      return;
    }

    var userId = response.data.session.user.id;
    loadTherapists(userId);
    loadBookings(userId);
  }).catch(function(error) {
    console.error("Session error:", error);
    window.location.href = "login.html";
  });
}

// Load therapists from Supabase
function loadTherapists(userId) {
  client.from("Therapists").select("*").then(function(response) {
    if (response.error) {
      console.error("Error loading therapists:", response.error);
      document.getElementById("therapist-list").innerHTML = "<p>Error loading therapists</p>";
      return;
    }

    var therapists = response.data;
    var html = "";

    for (var i = 0; i < therapists.length; i++) {
      var therapist = therapists[i];
      var therapistId = therapist.id;
      var therapistName = therapist.Name;
      var specialization = therapist.Specialization || "";

      html += '<div class="therapist-card" style="border:1px solid #ccc; padding:15px; margin:10px 0; border-radius:5px;">';
      html += '<h3>' + therapistName + '</h3>';
      if (specialization) {
        html += '<p style="color:#666; font-size:14px;">' + specialization + '</p>';
      }
      html += '<div style="margin:10px 0;">';
      html += '<label>Date: <input type="date" id="date-' + therapistId + '" style="margin:0 10px;"></label>';
      html += '<label>Time: <select id="time-' + therapistId + '" style="margin:0 10px;">';
      
