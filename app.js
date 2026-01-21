// ==============================
// SUPABASE CLIENT (SINGLE LOAD)
// ==============================
if (!window.__supabaseClient) {
  window.__supabaseClient = supabase.createClient(
    "https://hviqxpfnvjsqbdjfbttm.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs"
  );
}

const client = window.__supabaseClient;

// ==============================
// LOGIN
// ==============================
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  window.location.href = "dashboard.html";
};

// ==============================
// LOGOUT
// ==============================
window.logout = async function () {
  await client.auth.signOut();
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "login.html";
};

// ==============================
// DASHBOARD LOAD
// ==============================
window.loadDashboard = async function () {
  const { data } = await client.auth.getSession();

  if (!data || !data.session) {
    window.location.href = "login.html";
    return;
  }

  await loadTherapists();
  await loadBookings();
};

// ==============================
// LOAD THERAPISTS
// ==============================
async function loadTherapists() {
  const ul = document.getElementById("therapists");
  ul.innerHTML = "";

  const { data, error } = await client
    .from("Therapists")   // ✅ correct case
    .select("Name");      // ✅ correct case

  if (error) {
    console.error("Therapists error:", error.message);
    return;
  }

  data.forEach(t => {
    const li = document.createElement("li");
    li.textContent = t.Name; // ✅ exact column name
    ul.appendChild(li);
  });
}

// ==============================
// LOAD BOOKINGS
// ==============================
async function loadBookings() {
  const ul = document.getElementById("bookings");
  ul.innerHTML = "";

  const { data: userData } = await client.auth.getUser();
  const user = userData.user;

  if (!user) return;

  const { data, error } = await client
    .from("bookings")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error("Booking error:", error.message);
    return;
  }

  if (data.length === 0) {
    ul.innerHTML = "<li>No bookings yet</li>";
    return;
  }

  data.forEach(b => {
    const li = document.createElement("li");
    li.textContent = `Booking on ${new Date(b.created_at).toLocaleDateString()}`;
    ul.appendChild(li);
  });
}

