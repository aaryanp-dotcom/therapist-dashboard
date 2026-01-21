// ======================
// SUPABASE SETUP
// ======================
const SUPABASE_URL = "https://hviqxpfvjsqbdjfbttm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ---------- AUTH HELPERS ----------
async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ---------- LOGIN ----------
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

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

// ---------- LOGOUT (THIS FIXES YOUR STUCK LOGIN) ----------
async function logout() {
  await supabase.auth.signOut();
  localStorage.clear(); // force clear
  sessionStorage.clear();
  window.location.href = "login.html";
}

// ---------- DASHBOARD LOAD ----------
function loadDashboard() {
  supabase.auth.onAuthStateChange((event, session) => {
    if (!session) {
      window.location.href = "login.html";
      return;
    }

    // user is authenticated
    loadTherapists();
    loadBookings();
  });
}


  loadTherapists();
  loadBookings();
}

// ---------- LOAD THERAPISTS ----------
async function loadTherapists() {
  const list = document.getElementById("therapistList");
  list.innerHTML = "";

  const { data, error } = await supabase
    .from("Therapists") // CAPITAL T (your table name)
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  data.forEach((t) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${t.name}
      <input type="date" id="date-${t.id}">
      <button onclick="book('${t.id}')">Book</button>
    `;
    list.appendChild(li);
  });
}

// ---------- LOAD BOOKINGS ----------
async function loadBookings() {
  const list = document.getElementById("bookingList");
  list.innerHTML = "";

  const session = await getSession();

  const { data, error } = await supabase
    .from("Bookings")
    .select("id, session_date, Therapists(name)")
    .eq("user_id", session.user.id);

  if (error) {
    console.error(error);
    return;
  }

  data.forEach((b) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${b.Therapists.name} — ${b.session_date}
      <button onclick="cancel('${b.id}')">Cancel</button>
    `;
    list.appendChild(li);
  });
}

// ---------- BOOK ----------
async function book(therapistId) {
  const input = document.getElementById(`date-${therapistId}`);
  const date = input.value;

  if (!date) {
    alert("Select a date");
    return;
  }

  const session = await getSession();

  const { error } = await supabase.from("Bookings").insert({
    therapist_id: therapistId,
    user_id: session.user.id,
    session_date: date,
  });

  if (error) {
    alert(error.message);
    return;
  }

  loadBookings();
}

// ---------- CANCEL ----------
async function cancel(id) {
  await supabase.from("Bookings").delete().eq("id", id);
  loadBookings();
}

