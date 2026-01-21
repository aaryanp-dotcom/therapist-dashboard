// ======================
// SUPABASE SETUP
// ======================
const SUPABASE_URL = "https://hviqxpfvjsqbdjfbttm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ======================
// HELPERS
// ======================
function getDayOfWeek(dateStr) {
  return new Date(dateStr).getDay(); // 0 = Sunday
}

function addMinutes(timeStr, mins) {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m + mins, 0, 0);
  return d.toTimeString().slice(0, 5);
}

// ======================
// AUTH
// ======================
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
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn("Logout error, clearing manually");
  }

  // HARD CLEAR (important for GitHub Pages)
  localStorage.clear();
  sessionStorage.clear();

  window.location.replace("login.html");

}

// ======================
// DASHBOARD LOAD
// ======================
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

// ======================
// LOAD THERAPISTS
// ======================
async function loadTherapists() {
  const { data, error } = await supabase
    .from("Therapists")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  const list = document.getElementById("therapistList");
  list.innerHTML = "";

  data.forEach((t) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${t.name}</strong><br/>
      <input type="date" id="date-${t.id}" />
      <select id="time-${t.id}">
        <option value="">Select time</option>
      </select>
      <button onclick="loadSlots('${t.id}')">Load Times</button>
      <button onclick="book('${t.id}')">Book</button>
    `;

    list.appendChild(li);
  });
}

// ======================
// LOAD TIME SLOTS
// ======================
async function loadSlots(therapistId) {
  const dateInput = document.getElementById(`date-${therapistId}`);
  const date = dateInput.value;
  if (!date) {
    alert("Select a date first");
    return;
  }

  const day = getDayOfWeek(date);

  const { data: availability } = await supabase
    .from("therapist_availability")
    .select("*")
    .eq("therapist_id", therapistId)
    .eq("day_of_week", day);

  const { data: bookings } = await supabase
    .from("Bookings")
    .select("start_time,end_time")
    .eq("therapist_id", therapistId)
    .eq("session_date", date);

  const bookedTimes = bookings.map(
    (b) => `${b.start_time}-${b.end_time}`
  );

  const select = document.getElementById(`time-${therapistId}`);
  select.innerHTML = `<option value="">Select time</option>`;

  availability.forEach((a) => {
    let current = a.start_time.slice(0, 5);
    const end = a.end_time.slice(0, 5);

    while (current < end) {
      const next = addMinutes(current, a.slot_minutes);
      const key = `${current}:00-${next}:00`;

      if (!bookedTimes.includes(key)) {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = `${current} - ${next}`;
        select.appendChild(opt);
      }
      current = next;
    }
  });
}

// ======================
// BOOK
// ======================
async function book(therapistId) {
  const date = document.getElementById(`date-${therapistId}`).value;
  const time = document.getElementById(`time-${therapistId}`).value;

  if (!date || !time) {
    alert("Select date and time");
    return;
  }

  const [start_time, end_time] = time.split("-");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("Bookings").insert([
    {
      therapist_id: therapistId,
      user_id: user.id,
      session_date: date,
      start_time,
      end_time,
    },
  ]);

  if (error) {
    alert(error.message);
    return;
  }

  loadBookings();
}

// ======================
// LOAD BOOKINGS
// ======================
async function loadBookings() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("Bookings")
    .select("id, session_date, start_time, end_time, Therapists(name)")
    .eq("user_id", user.id)
    .order("session_date");

  if (error) {
    console.error(error);
    return;
  }

  const list = document.getElementById("bookingList");
  list.innerHTML = "";

  data.forEach((b) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${b.Therapists.name} — ${b.session_date}
      (${b.start_time.slice(0,5)} - ${b.end_time.slice(0,5)})
      <button onclick="cancel('${b.id}')">Cancel</button>
    `;
    list.appendChild(li);
  });
}

// ======================
// CANCEL
// ======================
async function cancel(id) {
  await supabase.from("Bookings").delete().eq("id", id);
  loadBookings();
}
