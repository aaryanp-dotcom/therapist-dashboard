// v3 – restore Book and Cancel buttons (force Netlify cache bust)

// ================== SUPABASE CLIENT ==================
const SUPABASE_URL = "https://hviqxpfnvjsqbdjfbttm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";
// v4 – inline booking UI with date picker (stable)
// v5 – disable already-booked dates in booking UI
// v4 – availability-based slot booking (date + time)
// v5 – availability-based slot booking (date + time, cache-safe)
/* =========================
   SUPABASE INIT (ONLY ONCE)
========================= */
const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

console.log("app.js loaded");

/* =========================
   HELPERS
========================= */

async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

/* =========================
   LOGIN PAGE LOGIC
========================= */

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const errorEl = document.getElementById("error");

      errorEl.textContent = "";

      const { error } = await supabase.auth.signInWithPassword({
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

/* =========================
   DASHBOARD PAGE LOGIC
========================= */

document.addEventListener("DOMContentLoaded", async () => {
  const therapistList = document.getElementById("therapists");
  const bookingsList = document.getElementById("bookings");
  const logoutBtn = document.getElementById("logout");

  if (!therapistList || !bookingsList) return;

  const user = await getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  /* ---------- LOGOUT ---------- */
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      await supabase.auth.signOut();
      window.location.href = "login.html";
    };
  }

  /* ---------- LOAD THERAPISTS ---------- */
  const { data: therapists } = await supabase
    .from("Therapists")
    .select("*");

  therapistList.innerHTML = "";

  therapists.forEach((t) => {
    const li = document.createElement("li");

    const dateInput = document.createElement("input");
    dateInput.type = "date";

    const bookBtn = document.createElement("button");
    bookBtn.textContent = "Book";

    const msg = document.createElement("div");
    msg.style.fontSize = "12px";

    bookBtn.onclick = async () => {
      if (!dateInput.value) {
        msg.textContent = "Select a date first";
        return;
      }

      const { error } = await supabase.from("Bookings").insert({
        user_id: user.id,
        therapist_id: t.id,
        session_date: dateInput.value,
      });

      if (error) {
        if (error.code === "23505") {
          msg.textContent = "You already have a booking on this date.";
        } else {
          msg.textContent = error.message;
        }
        return;
      }

      msg.textContent = "Booking created.";
      loadBookings();
    };

    li.innerHTML = `<strong>${t.name}</strong> `;
    li.appendChild(dateInput);
    li.appendChild(bookBtn);
    li.appendChild(msg);

    therapistList.appendChild(li);
  });

  /* ---------- LOAD BOOKINGS ---------- */
  async function loadBookings() {
    const { data: bookings } = await supabase
      .from("Bookings")
      .select("id, session_date, Therapists(name)")
      .eq("user_id", user.id)
      .order("session_date");

    bookingsList.innerHTML = "";

    bookings.forEach((b) => {
      const li = document.createElement("li");

      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Cancel";

      cancelBtn.onclick = async () => {
        await supabase.from("Bookings").delete().eq("id", b.id);
        loadBookings();
      };

      li.textContent = `${b.Therapists.name} — ${b.session_date} `;
      li.appendChild(cancelBtn);

      bookingsList.appendChild(li);
    });
  }

  loadBookings();
});


