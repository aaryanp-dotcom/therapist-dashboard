
// ==============================
// SUPABASE CLIENT (SINGLE LOAD)
// ==============================
var supabaseUrl =     "https://hviqxpfnvjsqbdjfbttm.supabase.co",
var supabaseUrl = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";
var client = supabase.createClient(supabaseUrl, supabaseKey);


// ==============================
// LOGIN
// ==============================
function login() {
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;

  client.auth.signInWithPassword({ email, password })
    .then(({ error }) => {
      if (error) {
        alert(error.message);
        return;
      }
      window.location.href = "dashboard.html";
    });
}

// ==============================
// LOGOUT
// ==============================
function logout() {
  client.auth.signOut().then(() => {
    window.location.href = "login.html";
  });
}

// ==============================
// DASHBOARD LOAD
// ==============================
function loadDashboard() {
  client.auth.getSession().then(({ data }) => {
    if (!data.session) {
      window.location.href = "login.html";
      return;
    }
    loadTherapists();
    loadBookings();
  });
}

// ==============================
// LOAD THERAPISTS
// ==============================
function loadTherapists() {
  var ul = document.getElementById("therapists");
  ul.innerHTML = "";

  client.from("Therapists")
    .select("id, full_name")
    .then(({ data, error }) => {
      if (error) {
        console.error(error.message);
        return;
      }

      data.forEach(t => {
        var li = document.createElement("li");
        li.innerHTML =
          t.full_name +
          ' <button onclick="bookSession(\'' + t.id + '\')">Book</button>';
        ul.appendChild(li);
      });
    });
}

// ==============================
// BOOK SESSION
// ==============================
async function bookSession(therapistId) {
  const { data: userData } = await client.auth.getUser();
  const user = userData.user;
  if (!user) {
    alert("Not logged in");
    return;
  }

  const dateInput = document.getElementById(`date-${therapistId}`);
  const timeInput = document.getElementById(`time-${therapistId}`);

  const sessionDate = dateInput.value;
  const sessionTime = timeInput.value;

  if (!sessionDate || !sessionTime) {
    alert("Please select date and time");
    return;
  }

  const { error } = await client.from("bookings").insert({
    therapist_id: therapistId,
    user_id: user.id,
    session_date: sessionDate,
    session_time: sessionTime,
    status: "booked"
  });

  if (error) {
    alert(error.message);
    console.error(error);
    return;
  }

  alert("Booking successful");
  loadBookings();
}

// ==============================
// LOAD BOOKINGS
// ==============================
function loadBookings() {
  var ul = document.getElementById("bookings");
  ul.innerHTML = "";

  client.auth.getUser().then(({ data }) => {
    var user = data.user;
    if (!user) return;

    client.from("bookings")
      .select("id, created_at, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error(error.message);
          return;
        }

        if (data.length === 0) {
          ul.innerHTML = "<li>No bookings yet</li>";
          return;
        }

        data.forEach(b => {
          var li = document.createElement("li");
          li.innerHTML =
            new Date(b.created_at).toLocaleString() +
            " (" + b.status + ") " +
            '<button onclick="cancelBooking(\'' + b.id + '\')">Cancel</button>';
          ul.appendChild(li);
        });
      });
  });
}

// ==============================
// CANCEL BOOKING
// ==============================
function cancelBooking(id) {
  client.from("bookings")
    .delete()
    .eq("id", id)
    .then(() => loadBookings());
}
