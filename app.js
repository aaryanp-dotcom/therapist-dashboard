// ==============================
// SUPABASE CLIENT (SINGLE LOAD)
// ==============================
const client = supabase.createClient(
    "https://hviqxpfnvjsqbdjfbttm.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs"
  );

// ==============================
// LOGIN
// ==============================
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);

  window.location.href = "dashboard.html";
};

// ==============================
// LOGOUT
// ==============================
window.logout = async function () {
  await client.auth.signOut();
  window.location.href = "login.html";
};

// ==============================
// DASHBOARD LOAD
// ==============================
window.loadDashboard = async function () {
  const { data } = await client.auth.getSession();
  if (!data.session) return (window.location.href = "login.html");

  loadTherapists();
  loadBookings();
};

// ==============================
// LOAD THERAPISTS
// ==============================
async function loadTherapists() {
  const ul = document.getElementById("therapists");
  ul.innerHTML = "";

  const { data, error } = await client.from("Therapists").select("id,name");
  if (error) return console.error(error.message);

  data.forEach(t => {
    const li = document.createElement("li");

    li.innerHTML = `
      ${t.name}
      <input type="date" id="date-${t.id}">
      <select id="time-${t.id}">
        <option>10:00 AM</option>
        <option>12:00 PM</option>
        <option>3:00 PM</option>
      </select>
      <button onclick="bookSession('${t.id}')">Book</button>
    `;

    ul.appendChild(li);
  });
}

// ==============================
// BOOK SESSION
// ==============================
window.bookSession = async function (therapistId) {
  const date = document.getElementById(`date-${therapistId}`).value;
  const time = document.getElementById(`time-${therapistId}`).value;

  if (!date) return alert("Select a date");

  const { data: userData } = await client.auth.getUser();
  const user = userData.user;

  const { error } = await client.from("bookings").insert({
    therapist_id: therapistId,
    user_id: user.id,
    session_date: date,
    session_time: time,
    status: "booked"
  });

  if (error) return alert(error.message);

  loadBookings();
};

// ==============================
// LOAD BOOKINGS
// ==============================
async function loadBookings() {
  const ul = document.getElementById("bookings");
  ul.innerHTML = "";

  const { data: userData } = await client.auth.getUser();
  const user = userData.user;

  const { data, error } = await client
    .from("bookings")
    .select("id, session_date, session_time, status")
    .eq("user_id", user.id)
    .order("session_date", { ascending: true });

  if (error) return console.error(error.message);

  if (!data.length) {
    ul.innerHTML = "<li>No bookings yet</li>";
    return;
  }

  data.forEach(b => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${b.session_date} at ${b.session_time}
      <button onclick="cancelBooking('${b.id}')">Cancel</button>
    `;
    ul.appendChild(li);
  });
}

// ==============================
// CANCEL BOOKING
// ==============================
window.cancelBooking = async function (id) {
  await client.from("bookings").delete().eq("id", id);
  loadBookings();
};
