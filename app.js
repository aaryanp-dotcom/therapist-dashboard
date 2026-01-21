// ======================
// SUPABASE SETUP
// ======================
const SUPABASE_URL = "https://hviqxpfvjsqbdjfbttm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ===== AUTH GUARD =====
async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.replace("login.html");
  }
}

// ===== LOGIN =====
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  window.location.replace("dashboard.html");
}

// ===== LOGOUT =====
async function logout() {
  await supabase.auth.signOut();
  localStorage.clear();
  sessionStorage.clear();
  window.location.replace("login.html");
}

// ===== DASHBOARD DATA =====
async function loadDashboard() {
  await requireAuth();

  // Therapists
  const { data: therapists, error } = await supabase
    .from("therapists")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  const list = document.getElementById("therapists");
  list.innerHTML = "";

  therapists.forEach(t => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${t.name}</strong>
      <input type="date" id="date-${t.id}">
      <button onclick="book('${t.id}')">Book</button>
    `;
    list.appendChild(li);
  });

  loadBookings();
}

// ===== BOOKINGS =====
async function loadBookings() {
  const { data: { session } } = await supabase.auth.getSession();

  const { data, error } = await supabase
    .from("bookings")
    .select("id, session_date, therapists(name)")
    .eq("user_id", session.user.id)
    .order("session_date");

  if (error) {
    console.error(error);
    return;
  }

  const list = document.getElementById("bookings");
  list.innerHTML = "";

  data.forEach(b => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${b.therapists.name} — ${b.session_date}
      <button onclick="cancelBooking('${b.id}')">Cancel</button>
    `;
    list.appendChild(li);
  });
}

// ===== BOOK =====
async function book(therapistId) {
  const dateInput = document.getElementById(`date-${therapistId}`);
  const date = dateInput.value;

  if (!date) {
    alert("Select a date");
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();

  const { error } = await supabase.from("bookings").insert({
    therapist_id: therapistId,
    user_id: session.user.id,
    session_date: date
  });

  if (error) {
    alert(error.message);
    return;
  }

  loadBookings();
}

// ===== CANCEL =====
async function cancelBooking(id) {
  await supabase.from("bookings").delete().eq("id", id);
  loadBookings();
}
