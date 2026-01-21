// ======================
// SUPABASE SETUP
// ======================
const SUPABASE_URL = "https://hviqxpfvjsqbdjfbttm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";


const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// =======================
// AUTH STATE LISTENER
// =======================
supabase.auth.onAuthStateChange((event, session) => {
  const path = window.location.pathname;

  // If user is NOT logged in
  if (!session) {
    if (!path.endsWith("login.html")) {
      window.location.href = "login.html";
    }
    return;
  }

  // If user IS logged in
  if (path.endsWith("login.html")) {
    window.location.href = "dashboard.html";
  }
});

// =======================
// LOGIN
// =======================
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  window.location.href = "dashboard.html";
}

// =======================
// LOGOUT (HARD RESET)
// =======================
async function logout() {
  await supabase.auth.signOut();

  localStorage.clear();
  sessionStorage.clear();

  window.location.href = "login.html";
}

// =======================
// DASHBOARD LOAD
// =======================
function loadDashboard() {
  loadTherapists();
  loadBookings();
}

// =======================
// LOAD THERAPISTS
// =======================
async function loadTherapists() {
  const list = document.getElementById("therapistList");
  if (!list) return;

  list.innerHTML = "";

  const { data, error } = await supabase
    .from("Therapists")
    .select("id, name");

  if (error) {
    console.error(error);
    return;
  }

  data.forEach(t => {
    const li = document.createElement("li");

    li.innerHTML = `
      ${t.name}
      <input type="date" id="date-${t.id}">
      <button onclick="book('${t.id}')">Book</button>
    `;

    list.appendChild(li);
  });
}

// =======================
// LOAD BOOKINGS
// =======================
async function loadBookings() {
  const list = document.getElementById("bookingList");
  if (!list) return;

  list.innerHTML = "";

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("bookings")
    .select("id, session_date, Therapists(name)")
    .eq("user_id", user.id)
    .order("session_date");

  if (error) {
    console.error(error);
    return;
  }

  data.forEach(b => {
    const li = document.createElement("li");

    li.innerHTML = `
      ${b.Therapists.name} — ${b.session_date}
      <button onclick="cancelBooking('${b.id}')">Cancel</button>
    `;

    list.appendChild(li);
  });
}

// =======================
// BOOK SESSION
// =======================
async function book(therapistId) {
  const dateInput = document.getElementById(`date-${therapistId}`);
  const sessionDate = dateInput.value;

  if (!sessionDate) {
    alert("Select a date");
    return;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("bookings").insert({
    therapist_id: therapistId,
    user_id: user.id,
    session_date: sessionDate,
  });

  if (error) {
    alert(error.message);
    return;
  }

  loadBookings();
}

// =======================
// CANCEL BOOKING
// =======================
async function cancelBooking(id) {
  await supabase.from("bookings").delete().eq("id", id);
  loadBookings();
}
