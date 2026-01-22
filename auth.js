// Supabase Configuration
var supabaseUrl = "https://hviqxpfnvjsqbdjfbttm.supabase.co";
var supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs";
var client = supabase.createClient(supabaseUrl, supabaseKey);

// Sign up as User
function signupUser() {
  var fullName = document.getElementById("fullName").value;
  var email = document.getElementById("email").value;
  var phone = document.getElementById("phone").value;
  var password = document.getElementById("password").value;
  var confirmPassword = document.getElementById("confirmPassword").value;

  // Validation
  if (!fullName || !email || !password || !confirmPassword) {
    alert("Please fill in all required fields");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters");
    return;
  }

  // Create user account
  client.auth.signUp({
    email: email,
    password: password
  }).then(function(response) {
    if (response.error) {
      alert("Signup failed: " + response.error.message);
      return;
    }

    var userId = response.data.user.id;

    // Wait a bit for trigger to create profile, then update it
    setTimeout(function() {
      client.from("profiles").update({
        full_name: fullName,
        phone: phone
      }).eq('id', userId).then(function(profileResponse) {
        if (profileResponse.error) {
          console.error("Profile update error:", profileResponse.error);
          // Don't show error to user - account was still created
        }

        alert("Account created successfully! You can now login.");
        window.location.href = "login.html";
      });
    }, 1000);
  });
}

// Sign up as Therapist
function signupTherapist() {
  var fullName = document.getElementById("fullName").value;
  var email = document.getElementById("email").value;
  var phone = document.getElementById("phone").value;
  var specialization = document.getElementById("specialization").value;
  var qualifications = document.getElementById("qualifications").value;
  var bio = document.getElementById("bio").value;
  var password = document.getElementById("password").value;
  var confirmPassword = document.getElementById("confirmPassword").value;

  // Validation
  if (!fullName || !email || !phone || !specialization || !qualifications || !password || !confirmPassword) {
    alert("Please fill in all required fields");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters");
    return;
  }

  // Create therapist account
  client.auth.signUp({
    email: email,
    password: password
  }).then(function(response) {
    if (response.error) {
      alert("Signup failed: " + response.error.message);
      return;
    }

    var userId = response.data.user.id;

    // Wait for trigger to create profile
    setTimeout(function() {
      // Update profile to therapist role
      client.from("profiles").update({
        full_name: fullName,
        phone: phone,
        role: 'therapist',
        status: 'pending'
      }).eq('id', userId).then(function(profileResponse) {
        if (profileResponse.error) {
          console.error("Profile update error:", profileResponse.error);
        }
      });

      // Insert therapist application
      client.from("Therapists").insert([{
        user_id: userId,
        Name: fullName,
        email: email,
        phone: phone,
        Specialization: specialization,
        qualifications: qualifications,
        bio: bio,
        approval_status: 'pending',
        Active: false
      }]).then(function(therapistResponse) {
        if (therapistResponse.error) {
          console.error("Therapist application error:", therapistResponse.error);
          alert("Error submitting application: " + therapistResponse.error.message);
          return;
        }

        alert("Application submitted successfully! An admin will review your profile. You'll be notified once approved.");
        window.location.href = "index.html";
      });
    }, 1000);
  });
}

// Login function with role-based redirect
function login() {
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  client.auth.signInWithPassword({
    email: email,
    password: password
  }).then(function(response) {
    if (response.error) {
      alert("Login failed: " + response.error.message);
      return;
    }

    var userId = response.data.user.id;

    // Get user profile to check role
    client.from("profiles").select("role, status").eq("id", userId).single().then(function(profileResponse) {
      if (profileResponse.error) {
        console.error("Profile fetch error:", profileResponse.error);
        alert("Error loading profile. Please contact support.");
        return;
      }

      var role = profileResponse.data.role;
      var status = profileResponse.data.status;

      // Check if therapist is still pending approval
      if (role === 'therapist' && status === 'pending') {
        alert("Your therapist application is still pending admin approval. Please wait for confirmation.");
        client.auth.signOut();
        return;
      }

      // Redirect based on role
      if (role === 'admin') {
        window.location.href = "admin-dashboard.html";
      } else if (role === 'therapist') {
        window.location.href = "therapist-dashboard.html";
      } else {
        window.location.href = "user-dashboard.html";
      }
    });
  });
}

// Logout function
function logout() {
  client.auth.signOut().then(function() {
    window.location.href = "index.html";
  });
}
