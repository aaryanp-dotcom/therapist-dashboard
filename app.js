// ==============================
// SUPABASE CLIENT (SINGLE LOAD)
// ==============================
if (!window.__supabaseClient) {
  window.__supabaseClient = supabase.createClient(
    "https://hviqxpfnvjsqbdjfbttm.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs"
  );
}

const client = window.__supabaseClient;

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

  await loadTherapists();
  await loadBookings();
};

// ==============================
// LOAD THERAPISTS + BOOK
// ==============================
async function loadTherapists() {
  const ul = document.getElementById("therapists");
  ul.innerHTML = "";

  const { data: therapists, error } = await client
    .from("Therapists")
    .select("id, Name")
    .eq("Active", true);

  if (error) return console.error(error.message);

  const { data: userData } = await client.auth.getUser();
  const user = userData.user;

  therapists.forEach(t => {
    const li = document.createElement("li");

    const name = document.createTextNode(t.Name + " ");
    const dateInput = document.createElement("input");
    dateInput.type = "date";

    const bookBtn = document.createElement("button");
    bookBtn.textContent = "Book";

    bookBtn.onclick = async () => {
      if (!dateInput.value) return alert("Select a date");

      const { error } = await client.from("bookings").insert({
        user_id: user.id,
        therapist_id: t.id,
        session_date: dateInput.value   // ✅ ONLY THIS COLUMN
      });

      if (error) return alert(error.message);
      loadBookings();
    };

    li.append(name, dateInput, bookBtn);
    ul.appendChild(li);
  });
}

// ==============================
// LOAD BOOKINGS + CANCEL
// ==============================
async function loadBookings() {
  const ul = document.getElementById("bookings");
  ul.innerHTML = "";

  const { data: userData } = await client.auth.getUser();
  const user = userData.user;

  const { data: bookings, error } = await client
    .from("bookings")
    .select("id, session_date")   // ✅ NO `date`
    .eq("user_id", user.id)
    .order("session_date", { ascending: true });

  if (error) return console.error(error.message);

  if (bookings.length === 0) {
    ul.innerHTML = "<li>No bookings yet</li>";
    return;
  }

  bookings.forEach(b => {
    const li = document.createElement("li");
    li.textContent = b.session_date + " ";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";

    cancelBtn.onclick = async () => {
      await client.from("bookings").delete().eq("id", b.id);
      loadBookings();
    };

    li.appendChild(cancelBtn);
    ul.appendChild(li);
  });
}
