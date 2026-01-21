
  const SUPABASE_URL = "https://hviqxpfnvjsqbdjfbttm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";


const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ----------------------------
// AUTH
// ----------------------------
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

async function logout() {
  await supabase.auth.signOut();
  localStorage.clear();
  window.location.href = "login.html";
}

// ----------------------------
// DASHBOARD
// ----------------------------
async function loadDashboard() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "login.html";
    return;
  }

  loadTherapists();
  loadBookings();
}

async function loadTherapists() {
  const list = document.getElementById("therapists");
  list.innerHTML = "";

  const { data, error } = await supabase
    .from("Therapists")   // CAPITAL T — THIS MATTERS
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  data.forEach(t => {
    const li = document.createElement("li");
    li.textContent = t.name;
    list.appendChild(li);
  });
}

async function loadBookings() {
  const list = document.getElementById("bookings");
  list.innerHTML = "";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    return;
  }

  data.forEach(b => {
    const li = document.createElement("li");
    li.textContent = `${b.date}`;
    list.appendChild(li);
  });
}


