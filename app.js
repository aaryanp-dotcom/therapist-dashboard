
  const SUPABASE_URL = "https://hviqxpfnvjsqbdjfbttm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";


window.supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ===== LOGIN =====
window.login = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  location.href = "dashboard.html";
};

// ===== LOGOUT =====
window.logout = async () => {
  await supabaseClient.auth.signOut();
  localStorage.clear();
  sessionStorage.clear();
  location.href = "login.html";
};

// ===== DASHBOARD =====
window.loadDashboard = async () => {
  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    location.href = "login.html";
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
    console.error("Therapist fetch error:", error);
    return;
  }

  const ul = document.getElementById("therapists");
  ul.innerHTML = "";

  data.forEach(t => {
    const li = document.createElement("li");

    // USE WHATEVER EXISTS
    li.textContent =
      t.full_name ||
      t.name ||
      t.email ||
      JSON.stringify(t);

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
    li.textContent = `${b.therapist_name} - ${b.session_date}`;
    ul.appendChild(li);
  });
}


