// Supabase Configuration
var supabaseUrl = "https://hviqxpfnvjsqbdjfbttm.supabase.co";
var supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";
var client = supabase.createClient(supabaseUrl, supabaseKey);

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
      html += '<option value="">Select time</option>';
      html += '<option value="09:00">09:00 AM</option>';
      html += '<option value="10:00">10:00 AM</option>';
      html += '<option value="11:00">11:00 AM</option>';
      html += '<option value="14:00">02:00 PM</option>';
      html += '<option value="15:00">03:00 PM</option>';
      html += '<option value="16:00">04:00 PM</option>';
      html += '</select></label>';
      html += '</div>';
      html += '<button onclick="bookSession('' + therapistId + '', '' + userId + '')" style="background:#4CAF50; color:white; padding:8px 16px; border:none; border-radius:4px; cursor:pointer;">Book Session</button>';
      html += '</div>';
    }
    document.getElementById("therapist-list").innerHTML = html;
  });
}

function bookSession(therapistId, userId) {
  var dateInput = document.getElementById("date-" + therapistId);
  var timeInput = document.getElementById("time-" + therapistId);
  if (!dateInput || !timeInput) {
    alert("Error: Form elements not found");
    return;
  }
  var sessionDate = dateInput.value;
  var sessionTime = timeInput.value;
  if (!sessionDate) {
    alert("Please select a date");
    return;
  }
  if (!sessionTime) {
    alert("Please select a time");
    return;
  }
  var bookingData = {
    user_id: userId,
    therapist_id: therapistId,
    session_date: sessionDate,
    session_time: sessionTime,
    status: "pending"
  };
  client.from("bookings").insert([bookingData]).then(function(response) {
    if (response.error) {
      console.error("Booking error:", response.error);
      alert("Error creating booking: " + response.error.message);
      return;
    }
    alert("Booking successful!");
    dateInput.value = "";
    timeInput.value = "";
    loadBookings(userId);
  });
}

function loadBookings(userId) {
  client.from("bookings").select("*, Therapists(*)").eq("user_id", userId).order("session_date", { ascending: true }).then(function(response) {
    if (response.error) {
      console.error("Error loading bookings:", response.error);
      document.getElementById("booking-list").innerHTML = "<p>Error loading bookings</p>";
      return;
    }
    var bookings = response.data;
    var html = "";
    if (bookings.length === 0) {
      html = "<p>No bookings yet</p>";
    } else {
      for (var i = 0; i < bookings.length; i++) {
        var booking = bookings[i];
        var therapistName = "Unknown";
        if (booking.Therapists) {
          therapistName = booking.Therapists.Name;
        }
        html += '<div class="booking-card" style="border:1px solid #ddd; padding:10px; margin:10px 0; border-radius:5px; background:#f9f9f9;">';
        html += '<strong>' + therapistName + '</strong><br>';
        html += 'Date: ' + booking.session_date + '<br>';
        html += 'Time: ' + booking.session_time + '<br>';
        html += 'Status: ' + (booking.status || "pending") + '<br>';
        html += '<button onclick="cancelBooking('' + booking.id + '', '' + userId + '')" style="background:#f44336; color:white; padding:5px 10px; border:none; border-radius:3px; cursor:pointer; margin-top:5px;">Cancel</button>';
        html += '</div>';
      }
    }
    document.getElementById("booking-list").innerHTML = html;
  });
}

function cancelBooking(bookingId, userId) {
  if (!confirm("Are you sure you want to cancel this booking?")) {
    return;
  }
  client.from("bookings").delete().eq("id", bookingId).then(function(response) {
    if (response.error) {
      console.error("Cancel error:", response.error);
      alert("Error cancelling booking");
      return;
    }
    alert("Booking cancelled");
    loadBookings(userId);
  });
}

function login() {
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;
  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }
  client.auth.signInWithPassword({
    email: email,
    password: password
  }).then(function(response) {
    if (response.error) {
      alert("Login failed: " + response.error.message);
      return;
    }
    window.location.href = "dashboard.html";
  });
}

function logout() {
  client.auth.signOut().then(function() {
    window.location.href = "login.html";
  });
}
