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
  
  client.auth.signUp({
    email: email,
    password: password
  }).then(function(response) {
    if (response.error) {
      alert("Signup failed: " + response.error.message);
      return;
    }
    
    var userId = response.data.user.id;
    
    // Manually create profile (no trigger)
    client.from("profiles").insert([{
      id: userId,
      email: email,
      full_name: fullName,
      phone: phone,
      role: 'user',
      status: 'active'
    }]).then(function(profileResponse) {
      if (profileResponse.error) {
        console.error("Profile creation error:", profileResponse.error);
      }
      
      alert("Account created successfully! You can now login.");
      window.location.href = "login.html";
    });
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
  
  client.auth.signUp({
    email: email,
    password: password
  }).then(function(response) {
    if (response.error) {
      alert("Signup failed: " + response.error.message);
      return;
    }
    
    var userId = response.data.user.id;
    
    // Create profile as therapist
    client.from("profiles").insert([{
      id: userId,
      email: email,
      full_name: fullName,
      phone: phone,
      role: 'therapist',
      status: 'pending'
    }]).then(function(profileResponse) {
      if (profileResponse.error) {
        console.error("Profile creation error:", profileResponse.error);
      }
    });
    
    // Create therapist application
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
        alert("Error: " + therapistResponse.error.message);
        return;
      }
      
      alert("Application submitted! Admin will review your profile.");
      window.location.href = "index.html";
    });
  });
}

// Login with role-based redirect - FIXED VERSION
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
    
    // Changed: Remove .single() and handle array result
    client.from("profiles").select("role, status").eq("id", userId).then(function(profileResponse) {
      if (profileResponse.error) {
        console.error("Profile error:", profileResponse.error);
        alert("Error loading profile");
        return;
      }
      
      // Check if profile exists
      if (!profileResponse.data || profileResponse.data.length === 0) {
        console.log("No profile found, creating one...");
        
        // Create profile with role 'user' by default
        client.from("profiles").insert([{
          id: userId,
          email: email,
          role: 'user',
          status: 'active',
          full_name: email.split('@')[0]
        }]).then(function(insertResponse) {
          if (insertResponse.error) {
            console.error("Profile creation error:", insertResponse.error);
            alert("Error creating profile");
            return;
          }
          
          // Redirect to user dashboard
          setTimeout(function() {
            window.location.href = "user-dashboard.html";
          }, 1000);
        });
        return;
      }
      
      var profile = profileResponse.data[0];
      var role = profile.role;
      var status = profile.status;
      
      if (role === 'therapist' && status === 'pending') {
        alert("Your therapist application is pending admin approval.");
        client.auth.signOut();
        return;
      }
      
      // Wait for session to be saved before redirect
      setTimeout(function() {
        if (role === 'admin') {
          window.location.href = "admin-dashboard.html";
        } else if (role === 'therapist') {
          window.location.href = "therapist-dashboard.html";
        } else {
          window.location.href = "user-dashboard.html";
        }
      }, 1000);
    });
  });
}

function logout() {
  client.auth.signOut().then(function() {
    window.location.href = "index.html";
  });
}
