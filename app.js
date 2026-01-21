const SUPABASE_URL = "https://hviqxpfnvjsqbdjfbttm.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_KEY";

const supabaseClient =
  window.supabaseClient ||
  window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.supabaseClient = supabaseClient;

document.addEventListener("DOMContentLoaded", async () => {
  console.log("app.js loaded");

  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", login);
  }

  if (document.getElementById("therapistList")) {
    console.log("Loading therapists...");
    loadTherapists();
  }

  if (document.getElementById("bookings-list")) {
    console.log("Loading bookings...");
    loadBookings();
  }
});

async function login() {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;

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

async function loadTherapists() {
  const list = document.getElementById("therapistList");
  if (!list) return;

  const { data } = await supabaseClient
    .from("Therapists")
    .select("Name");

  list.innerHTML = "";
  data.forEach(t => {
    const li = document.createElement("li");
    li.textContent = t.Name;
    list.appendChild(li);
  });
}

async function loadBookings() {
  const list = document.getElementById("bookings-list");
  if (!list) return;

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const { data } = await supabaseClient
    .from("Bookings")
    .select("session_date, Therapists(Name)")
    .eq("user_id", user.id);

  list.innerHTML = "";
  data.forEach(b => {
    const li = document.createElement("li");
    li.textContent = `${b.Therapists.Name} — ${b.session_date}`;
    list.appendChild(li);
  });
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}
