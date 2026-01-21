
  const SUPABASE_URL = "https://hviqxpfnvjsqbdjfbttm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ===== LOGIN =====
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  window.location.href = "dashboard.html";
};

// ===== LOGOUT =====
window.logout = async function () {
  await supabaseClient.auth.signOut();
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "login.html";
};

// ===== DASHBOARD LOAD =====
window.loadDashboard = async function () {
  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    window.location.href = "login.html";
    return;
  }

  loadTherapists();
  loadBookings();
};

// ===== THERAPISTS =====
async function loadTherapists() {
  const { data, error } = await supabaseClient
    .from("Therapists")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  const ul = document.getElementById("therapists");
  ul.innerHTML = "";

  data.forEach(t => {
    const li = document.createElement("li");
    li.innerText = t.name;
    ul.appendChild(li);
  });
}

// ===== BOOKINGS =====
async function loadBookings() {
  const { data, error } = await supabaseClient
    .from("bookings")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  const ul = document.getElementById("bookings");
  ul.innerHTML = "";

  data.forEach(b => {
    const li = document.createElement("li");
    li.innerText = `${b.therapist_name} - ${b.session_date}`;
    ul.appendChild(li);
  });
}

