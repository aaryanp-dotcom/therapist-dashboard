
console.log("app.js loaded");

// ---------- SUPABASE CLIENT ----------
const SUPABASE_URL = "https://hviqxpfnvjsqbdjfbttm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// 2️⃣ Run when page loads
document.addEventListener("DOMContentLoaded", async () => {
  await loadTherapists();
  await loadBookings();
});

// ---------------- THERAPISTS ----------------
async function loadTherapists() {
  console.log("Loading therapists...");

  const list = document.getElementById("therapistList");

  const { data, error } = await supabaseClient
    .from("Therapists")
    .select("id, Name");

  if (error) {
    console.error(error);
    list.innerHTML = "<li>Error loading therapists</li>";
    return;
  }

  list.innerHTML = "";

  data.forEach((t) => {
    const li = document.createElement("li");
    li.textContent = t.Name;
    list.appendChild(li);
  });
}

// ---------------- BOOKINGS ----------------
async function loadBookings() {
  console.log("Loading bookings...");

  const list = document.getElementById("bookings-list");

  // Supabase v2 auth
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    list.innerHTML = "<li>Please log in</li>";
    return;
  }

  const { data, error } = await supabaseClient
    .from("Bookings")
    .select("session_date")
    .eq("user_id", user.id)
    .order("session_date", { ascending: true });

  if (error) {
    console.error(error);
    list.innerHTML = "<li>Error loading bookings</li>";
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = "<li>No bookings yet</li>";
    return;
  }

  list.innerHTML = "";

  data.forEach((b) => {
    const li = document.createElement("li");
    li.textContent = `${b.session_date} — pending`;
    list.appendChild(li);
  });
}

// ---------------- LOGOUT ----------------
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}
