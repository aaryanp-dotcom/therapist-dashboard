// ================== SUPABASE CLIENT (INIT ONCE) ==================
const SUPABASE_URL = "https://hviqxpfnvjsqbdjfbttm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";

// IMPORTANT: do NOT redeclare if already exists
window.supabaseClient =
  window.supabaseClient ||
  window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const supabaseClient = window.supabaseClient;

// ================== PAGE LOAD ==================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("app.js loaded");

  if (document.getElementById("therapistList")) {
    await loadTherapists();
  }

  if (document.getElementById("bookings-list")) {
    await loadBookings();
  }
});

// ================== LOGIN ==================
window.login = async function login() {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    alert("Enter email and password");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  window.location.href = "dashboard.html";
};

// ================== LOAD THERAPISTS ==================
async function loadTherapists() {
  const list = document.getElementById("therapistList");
  if (!list) return;

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

// ================== LOAD BOOKINGS ==================
async function loadBookings() {
  const list = document.getElementById("bookings-list");
  if (!list) return;

  const {
    data: { user },
    error: authError,
  } = await supabaseClient.auth.getUser();

  if (authError || !user) {
    list.innerHTML = "<li>Please log in</li>";
    return;
  }

  const { data, error } = await supabaseClient
    .from("Bookings")
    .select(`session_date, Therapists ( Name )`)
    .eq("user_id", user.id)
    .order("session_date", { ascending: true });

  if (error) {
    console.error(error);
    list.innerHTML = "<li>Error loading bookings</li>";
    return;
  }

  if (!data || data.length
