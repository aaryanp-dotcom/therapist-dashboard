// ================== SUPABASE CLIENT ==================
const SUPABASE_URL = "https://hviqxpfnvjsqbdjfbttm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";

const supabaseClient =
  window.supabaseClient ||
  window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.supabaseClient = supabaseClient;

// ================== PAGE LOAD ==================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("app.js loaded");

  // LOGIN PAGE
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", login);
    return;
  }

  // DASHBOARD PAGE
  if (
    document.getElementById("therapistList") ||
    document.getElementById("bookings-list")
  ) {
    await ensureAuthenticated();
    await loadTherapists();
    await loadBookings();
  }
});

// ================== AUTH GUARD ==================
async function ensureAuthenticated() {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (!user) {
    window.location.href = "login.html";
  }

  return user;
}

// ================== LOGIN ==================
async function login() {
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
    alert(error.message);
    return;
  }

  window.location.href = "dashboard.html";
}

// ================== LOAD THERAPISTS ==================
async function loadTherapists() {
  const list = document.getElementById("therapistList");
  if (!list) return;

  list.innerHTML = "<li>Loading therapists...</li>";

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

    const text = document.createElement("span");
    text.textContent = t.Name;

    const btn = document.createElement("button");
    btn.textContent = "Book";
    btn.style.marginLeft = "10px";

    btn.addEventListener("click", () => bookTherapist(t.id));

    li.appendChild(text);
    li.appendChild(btn);
    list.appendChild(li);
  });
}

// ================== BOOK THERAPIST ==================
async function bookTherapist(therapistId) {
  const sessionDate = prompt("Enter session date (YYYY-MM-DD)");
  if (!sessionDate) return;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
    alert("Invalid date format");
    return;
  }

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  const { error } = await supabaseClient
    .from("Bookings")
    .insert({
      user_id: user.id,
      therapist_id: therapistId,
      session_date: sessionDate,
    });

  if (error) {
    if (error.code === "23505") {
      alert("You already have a booking on this date.");
    } else {
      console.error(error);
      alert("Could not create booking");
    }
    return;
  }

  alert("Booking created");
  loadBookings();
}

// ================== LOAD BOOKINGS ==================
async function loadBookings() {
  const list = document.getElementById("bookings-list");
  if (!list) return;

  list.innerHTML = "<li>Loading bookings...</li>";

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  const { data, error } = await supabaseClient
    .from("Bookings")
    .select("id, session_date, Therapists(Name)")
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

    const text = document.createElement("span");
    text.textContent = `${b.Therapists.Name} — ${b.session_date}`;

    const btn = document.createElement("button");
    btn.textContent = "Cancel";
    btn.style.marginLeft = "10px";

    btn.addEventListener("click", async () => {
      const confirmCancel = confirm("Cancel this booking?");
      if (!confirmCancel) return;

      const { error: deleteError } = await supabaseClient
        .from("Bookings")
        .delete()
        .eq("id", b.id);

      if (deleteError) {
        console.error(deleteError);
        alert("Could not cancel booking");
        return;
      }

      loadBookings();
    });

    li.appendChild(text);
    li.appendChild(btn);
    list.appendChild(li);
  });
}

// ================== LOGOUT ==================
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}
