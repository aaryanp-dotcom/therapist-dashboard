// v3 – restore Book and Cancel buttons (force Netlify cache bust)

// ================== SUPABASE CLIENT ==================
const SUPABASE_URL = "https://hviqxpfnvjsqbdjfbttm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";
// ---------- SUPABASE CLIENT ----------
let supabaseClient = null;

if (typeof supabase !== "undefined") {
  supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}

);

// ---------- LOGIN ----------
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const errorEl = document.getElementById("error");

      errorEl.textContent = "";

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        errorEl.textContent = error.message;
        return;
      }

      window.location.href = "dashboard.html";
    });
  }
});

// ---------- DASHBOARD ----------
async function loadDashboard() {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  loadTherapists();
  loadBookings();
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("therapistList")) {
    loadDashboard();
  }
});

// ---------- LOAD THERAPISTS ----------
async function loadTherapists() {
  const list = document.getElementById("therapistList");
  if (!list) return;

  const { data } = await supabaseClient
    .from("Therapists")
    .select("id, Name");

  list.innerHTML = "";

  data.forEach((t) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${t.Name}
      <input type="date" id="date-${t.id}" />
      <button onclick="book('${t.id}')">Book</button>
    `;
    list.appendChild(li);
  });
}

// ---------- LOAD BOOKINGS ----------
async function loadBookings() {
  const list = document.getElementById("bookings-list");
  if (!list) return;

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  const { data } = await supabaseClient
    .from("Bookings")
    .select("id, session_date, Therapists(Name)")
    .eq("user_id", user.id)
    .order("session_date");

  list.innerHTML = "";

  data.forEach((b) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${b.Therapists.Name} — ${b.session_date}
      <button onclick="cancelBooking('${b.id}')">Cancel</button>
    `;
    list.appendChild(li);
  });
}

// ---------- BOOK ----------
async function book(therapistId) {
  const input = document.getElementById(`date-${therapistId}`);
  const date = input.value;
  if (!date) return alert("Select a date");

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  const { error } = await supabaseClient.from("Bookings").insert({
    therapist_id: therapistId,
    user_id: user.id,
    session_date: date,
  });

  if (error) {
    alert(error.message);
    return;
  }

  loadBookings();
}

// ---------- CANCEL ----------
async function cancelBooking(id) {
  await supabaseClient.from("Bookings").delete().eq("id", id);
  loadBookings();
}

// ---------- LOGOUT ----------
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}



