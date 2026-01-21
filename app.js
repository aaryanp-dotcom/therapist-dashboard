// v3 – restore Book and Cancel buttons (force Netlify cache bust)

// ================== SUPABASE CLIENT ==================
const SUPABASE_URL = "https://hviqxpfnvjsqbdjfbttm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";
// v4 – inline booking UI with date picker (stable)
// v5 – disable already-booked dates in booking UI

const supabaseClient =
  window.supabaseClient ||
  window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.supabaseClient = supabaseClient;

// ================== GLOBAL STATE ==================
let bookedDates = new Set();

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
    await loadUserBookedDates();
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

// ================== LOAD USER BOOKED DATES ==================
async function loadUserBookedDates() {
  bookedDates.clear();

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  const { data, error } = await supabaseClient
    .from("Bookings")
    .select("session_date")
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to load booked dates", error);
    return;
  }

  data.forEach((b) => bookedDates.add(b.session_date));
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
    li.style.marginBottom = "14px";

    const name = document.createElement("strong");
    name.textContent = t.Name;

    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.style.marginLeft = "10px";
    dateInput.min = new Date().toISOString().split("T")[0];

    const bookBtn = document.createElement("button");
    bookBtn.textContent = "Book";
    bookBtn.style.marginLeft = "6px";

    const msg = document.createElement("div");
    msg.style.fontSize = "14px";
    msg.style.marginTop = "4px";

    dateInput.addEventListener("change", () => {
      if (bookedDates.has(dateInput.value)) {
        msg.textContent = "You already have a booking on this date.";
        bookBtn.disabled = true;
      } else {
        msg.textContent = "";
        bookBtn.disabled = false;
      }
    });

    bookBtn.addEventListener("click", async () => {
      msg.textContent = "";
      bookBtn.disabled = true;

      if (!dateInput.value) {
        msg.textContent = "Please select a date.";
        bookBtn.disabled = false;
        return;
      }

      await bookTherapist(t.id, dateInput.value, msg);
      await loadUserBookedDates();
      await loadBookings();
      bookBtn.disabled = false;
    });

    li.appendChild(name);
    li.appendChild(dateInput);
    li.appendChild(bookBtn);
    li.appendChild(msg);

    list.appendChild(li);
  });
}

// ================== BOOK THERAPIST ==================
async function bookTherapist(therapistId, sessionDate, msgEl) {
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
      msgEl.textContent = "You already have a booking on this date.";
    } else {
      console.error(error);
      msgEl.textContent = "Could not create booking.";
    }
    return;
  }

  msgEl.textContent = "Booking created.";
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

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.marginLeft = "10px";

    cancelBtn.addEventListener("click", async () => {
      const ok = confirm("Cancel this booking?");
      if (!ok) return;

      const { error: delError } = await supabaseClient
        .from("Bookings")
        .delete()
        .eq("id", b.id);

      if (delError) {
        alert("Could not cancel booking");
        return;
      }

      await loadUserBookedDates();
      await loadBookings();
    });

    li.appendChild(text);
    li.appendChild(cancelBtn);
    list.appendChild(li);
  });
}

// ================== LOGOUT ==================
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}


