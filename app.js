// v3 – restore Book and Cancel buttons (force Netlify cache bust)

// ================== SUPABASE CLIENT ==================
const SUPABASE_URL = "https://hviqxpfnvjsqbdjfbttm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";
// ---------- SUPABASE CLIENT ----------
// ---------- SUPABASE SETUP ----------
const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

console.log("app.js loaded");

// ---------- AUTH ----------
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  window.location.href = "dashboard.html";
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = "login.html";
}

// ---------- PAGE LOAD ----------
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session && !location.pathname.endsWith("login.html")) {
    window.location.href = "login.html";
    return;
  }

  if (location.pathname.endsWith("dashboard.html")) {
    loadTherapists();
    loadBookings();
  }
});

// ---------- LOAD THERAPISTS ----------
async function loadTherapists() {
  const list = document.getElementById("therapistList");
  list.innerHTML = "";

  const { data: therapists } = await supabase
    .from("therapists")
    .select("*");

  therapists.forEach(t => {
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${t.name}</strong>
      <input type="date" id="date-${t.id}" onchange="loadTimeSlots('${t.id}')">
      <select id="time-${t.id}" disabled>
        <option value="">Select time</option>
      </select>
      <button onclick="bookSession('${t.id}')">Book</button>
    `;

    list.appendChild(li);
  });
}

// ---------- LOAD TIME SLOTS ----------
async function loadTimeSlots(therapistId) {
  const dateInput = document.getElementById(`date-${therapistId}`);
  const timeSelect = document.getElementById(`time-${therapistId}`);

  if (!dateInput.value) return;

  timeSelect.innerHTML = `<option>Loading...</option>`;
  timeSelect.disabled = true;

  const dayOfWeek = new Date(dateInput.value).getDay();

  const { data: availability } = await supabase
    .from("therapist_availability")
    .select("*")
    .eq("therapist_id", therapistId)
    .eq("day_of_week", dayOfWeek);

  if (!availability || availability.length === 0) {
    timeSelect.innerHTML = `<option>No availability</option>`;
    return;
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("start_time")
    .eq("therapist_id", therapistId)
    .eq("session_date", dateInput.value);

  const bookedTimes = bookings.map(b => b.start_time);

  timeSelect.innerHTML = `<option value="">Select time</option>`;

  availability.forEach(slot => {
    let current = slot.start_time;

    while (current < slot.end_time) {
      if (!bookedTimes.includes(current)) {
        const opt = document.createElement("option");
        opt.value = current;
        opt.textContent = current.slice(0,5);
        timeSelect.appendChild(opt);
      }
      current = addMinutes(current, slot.slot_minutes);
    }
  });

  timeSelect.disabled = false;
}

// ---------- BOOK SESSION ----------
async function bookSession(therapistId) {
  const dateInput = document.getElementById(`date-${therapistId}`);
  const timeSelect = document.getElementById(`time-${therapistId}`);

  if (!dateInput.value || !timeSelect.value) {
    alert("Select date and time");
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from("bookings").insert({
    user_id: user.id,
    therapist_id: therapistId,
    session_date: dateInput.value,
    start_time: timeSelect.value,
    end_time: timeSelect.value
  });

  loadBookings();
  loadTimeSlots(therapistId);
}

// ---------- LOAD BOOKINGS ----------
async function loadBookings() {
  const list = document.getElementById("bookingList");
  list.innerHTML = "";

  const { data: { user } } = await supabase.auth.getUser();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, session_date, start_time, therapists(name)")
    .eq("user_id", user.id)
    .order("session_date");

  bookings.forEach(b => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${b.therapists.name} — ${b.session_date} ${b.start_time.slice(0,5)}
      <button onclick="cancelBooking('${b.id}')">Cancel</button>
    `;
    list.appendChild(li);
  });
}

// ---------- CANCEL ----------
async function cancelBooking(id) {
  await supabase.from("bookings").delete().eq("id", id);
  loadBookings();
}

// ---------- UTIL ----------
function addMinutes(time, mins) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m + mins);
  return d.toTimeString().slice(0,8);
}



