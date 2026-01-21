// v3 – restore Book and Cancel buttons (force Netlify cache bust)

// ================== SUPABASE CLIENT ==================
const SUPABASE_URL = "https://hviqxpfnvjsqbdjfbttm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";
// v4 – inline booking UI with date picker (stable)
// v5 – disable already-booked dates in booking UI
// v4 – availability-based slot booking (date + time)
const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ================== PAGE LOAD ==================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("app.js loaded");
  await loadTherapists();
  await loadBookings();
});

// ================== LOAD THERAPISTS ==================
async function loadTherapists() {
  const list = document.getElementById("therapistList");
  if (!list) return;

  const { data, error } = await supabaseClient
    .from("Therapists")
    .select("id, Name");

  if (error) {
    list.innerHTML = "<li>Error loading therapists</li>";
    return;
  }

  list.innerHTML = "";

  data.forEach(t => {
    const li = document.createElement("li");

    const name = document.createElement("strong");
    name.textContent = t.Name;

    const dateInput = document.createElement("input");
    dateInput.type = "date";

    const slotSelect = document.createElement("select");
    slotSelect.disabled = true;

    const bookBtn = document.createElement("button");
    bookBtn.textContent = "Book";
    bookBtn.disabled = true;

    dateInput.onchange = async () => {
      slotSelect.innerHTML = "";
      slotSelect.disabled = true;
      bookBtn.disabled = true;

      const slots = await getAvailableSlots(t.id, dateInput.value);

      if (slots.length === 0) {
        const opt = document.createElement("option");
        opt.textContent = "No slots available";
        slotSelect.appendChild(opt);
        return;
      }

      slots.forEach(s => {
        const opt = document.createElement("option");
        opt.value = `${s.start}-${s.end}`;
        opt.textContent = `${s.start} – ${s.end}`;
        slotSelect.appendChild(opt);
      });

      slotSelect.disabled = false;
      bookBtn.disabled = false;
    };

    bookBtn.onclick = async () => {
      const [start_time, end_time] = slotSelect.value.split("-");
      await bookSlot(t.id, dateInput.value, start_time, end_time);
    };

    li.appendChild(name);
    li.append(" ");
    li.appendChild(dateInput);
    li.append(" ");
    li.appendChild(slotSelect);
    li.append(" ");
    li.appendChild(bookBtn);

    list.appendChild(li);
  });
}

// ================== SLOT LOGIC ==================
async function getAvailableSlots(therapist_id, dateStr) {
  const weekday = new Date(dateStr).getDay();

  const { data: availability } = await supabaseClient
    .from("therapist_availability")
    .select("*")
    .eq("therapist_id", therapist_id)
    .eq("day_of_week", weekday);

  if (!availability || availability.length === 0) return [];

  const rule = availability[0];

  const { data: bookings } = await supabaseClient
    .from("Bookings")
    .select("start_time, end_time")
    .eq("therapist_id", therapist_id)
    .eq("session_date", dateStr);

  const slots = [];
  let current = rule.start_time;

  while (current < rule.end_time) {
    const end = addMinutes(current, rule.slot_minutes);

    const overlap = bookings?.some(b =>
      !(end <= b.start_time || current >= b.end_time)
    );

    if (!overlap) {
      slots.push({ start: current, end });
    }

    current = end;
  }

  return slots;
}

function addMinutes(time, mins) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(0, 0, 0, h, m + mins);
  return d.toTimeString().slice(0, 5);
}

// ================== BOOK SLOT ==================
async function bookSlot(therapist_id, date, start_time, end_time) {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    alert("Please log in");
    return;
  }

  const { error } = await supabaseClient.from("Bookings").insert({
    user_id: user.id,
    therapist_id,
    session_date: date,
    start_time,
    end_time
  });

  if (error) {
    if (error.code === "23505") {
      alert("You already have a booking on this date.");
    } else {
      alert("Booking failed");
      console.error(error);
    }
    return;
  }

  alert("Booking confirmed");
  loadBookings();
}

// ================== LOAD BOOKINGS ==================
async function loadBookings() {
  const list = document.getElementById("bookings-list");
  if (!list) return;

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const { data } = await supabaseClient
    .from("Bookings")
    .select(`
      id,
      session_date,
      start_time,
      end_time,
      Therapists ( Name )
    `)
    .eq("user_id", user.id)
    .order("session_date");

  list.innerHTML = "";

  data.forEach(b => {
    const li = document.createElement("li");
    li.textContent = `${b.Therapists.Name} — ${b.session_date} ${b.start_time}-${b.end_time}`;

    const btn = document.createElement("button");
    btn.textContent = "Cancel";

    btn.onclick = async () => {
      await supabaseClient.from("Bookings").delete().eq("id", b.id);
      loadBookings();
    };

    li.append(" ");
    li.appendChild(btn);
    list.appendChild(li);
  });
}

// ================== LOGOUT ==================
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}
