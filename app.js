
// --- Supabase client (guarded) ---
if (!window.__supabase) {
  window.__supabase = supabase.createClient(
    "https://hviqxpfvnjsqbdjfbttm.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";
):
}

const client = window.__supabase;

// --- LOGIN ---
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  location.href = "dashboard.html";
};

// --- LOGOUT ---
window.logout = async function () {
  await client.auth.signOut();
  localStorage.clear();
  location.href = "login.html";
};

// --- DASHBOARD ---
window.loadDashboard = async function () {
  const { data } = await client.auth.getSession();

  if (!data.session) {
    location.href = "login.html";
    return;
  }

  loadTherapists();
  loadBookings();
};

async function loadTherapists() {
  const ul = document.getElementById("therapists");
  ul.innerHTML = "";

  const { data, error } = await client
    .from("Therapists") // CAPITAL T (your table)
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  data.forEach(t => {
    const li = document.createElement("li");
    li.textContent = t.name;
    ul.appendChild(li);
  });
}

async function loadBookings() {
  const ul = document.getElementById("bookings");
  ul.innerHTML = "";

  const { data: user } = await client.auth.getUser();

  const { data, error } = await client
    .from("bookings")
    .select("*")
    .eq("user_id", user.user.id);

  if (error) {
    console.error(error);
    return;
  }

  data.forEach(b => {
    const li = document.createElement("li");
    li.textContent = b.date;
    ul.appendChild(li);
  });
}


