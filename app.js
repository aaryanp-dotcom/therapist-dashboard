
// ==============================
// SUPABASE CLIENT (SINGLE LOAD)
// ==============================
const supabaseUrl =     "https://hviqxpfnvjsqbdjfbttm.supabase.co",
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";
const client = supabase.createClient(supabaseUrl, supabaseKey);

// ==============================
// LOGIN
// ==============================
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await client.auth.signInWithPassword({
    email,
    password,
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
  window.location.href = "login.html";
};

// ==============================
// DASHBOARD LOAD
// ==============================
window.loadDashboard = async function () {
  const { data } = await client.auth.getSession();

  if (!data.session) {
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
    .from("Therapists")
    .select("id, full_name");

  if (error) {
    console.error(error.message);
    return;
  }

  data.forEach((t) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${t.full_name}
      <button onclick="bookSession('${t.id}')">Book</button>
    `;
    ul.appendChild(li);
  });
}

// ==============================
// BOOK SESSION
// ==============================
window.bookSession = async function (therapistId) {
  const { data: userData } = await client.auth.getUser();
  const user = userData.user;

  if (!user) {
    alert("Not logged in");
    return;
  }

  const { error } = await client.from("bookings").insert({
    therapist_id: therapistId,
    user_id: user.id,
    status: "booked",
  });

  if (error) {
    alert(error.message);
    return;
  }

  await loadBookings();
};

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
    .select("id, created_at, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error.message);
    return;
  }

  if (data.length === 0) {
    ul.innerHTML = "<li>No bookings yet</li>";
    return;
  }

  data.forEach((b) => {
    const li = document.createElement("li");
    const date = new Date(b.created_at).toLocaleString();

    li.innerHTML = `
      ${date} (${b.status})
      <button onclick="cancelBooking('${b.id}')">Cancel</button>
    `;
    ul.appendChild(li);
  });
}

// ==============================
// CANCEL BOOKING
// ==============================
window.cancelBooking = async function (bookingId) {
  const { error } = await client
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  if (error) {
    alert(error.message);
    return;
  }

  await loadBookings();
};

