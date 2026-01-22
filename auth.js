// Supabase Configuration
const SUPABASE_URL = 'https://hviqxpfnvjsqbdjfbttm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2aXF4cGZudmpzcWJkamZidHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDM0NzIsImV4cCI6MjA4NDQxOTQ3Mn0.P3UWgbYx4MLMJktsXjFsAEtsNpTjqPnO31s2Oyy0BFs';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Login Function
async function login(email, password) {
    try {
        console.log('Attempting login for:', email);

        // Step 1: Authenticate with Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) {
            console.error('Auth error:', authError);
            alert('❌ Login failed: ' + authError.message);
            return;
        }

        console.log('Auth successful:', authData);

        // Step 2: Get user profile from profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            console.error('Profile error:', profileError);
            alert('❌ Error loading profile: ' + profileError.message);
            return;
        }

        console.log('Profile loaded:', profile);

        // Step 3: Check if therapist is approved
        if (profile.role === 'therapist') {
            const { data: therapist, error: therapistError } = await supabase
                .from('Therapists')
                .select('approval_status')
                .eq('user_id', profile.id)
                .single();

            if (therapistError) {
                console.error('Therapist check error:', therapistError);
                alert('❌ Error checking therapist status');
                return;
            }

            if (therapist.approval_status !== 'approved') {
                alert('⚠️ Your therapist account is pending approval. Please wait for admin approval.');
                await supabase.auth.signOut();
                return;
            }
        }

        // Step 4: Store user data in localStorage
        const userData = {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role
        };

        localStorage.setItem('user', JSON.stringify(userData));
        console.log('User stored in localStorage:', userData);

        // Step 5: Redirect based on role
        if (profile.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else if (profile.role === 'therapist') {
            window.location.href = 'therapist-dashboard.html';
        } else if (profile.role === 'user') {
            window.location.href = 'user-dashboard.html';
        } else {
            alert('❌ Invalid user role');
            await supabase.auth.signOut();
        }

    } catch (error) {
        console.error('Login error:', error);
        alert('❌ An error occurred during login: ' + error.message);
    }
}

// Signup User Function
async function signupUser(email, password, fullName, phone) {
    try {
        // Step 1: Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (authError) {
            alert('❌ Signup failed: ' + authError.message);
            return;
        }

        // Step 2: Create profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: authData.user.id,
                email: email,
                full_name: fullName,
                phone: phone,
                role: 'user',
                status: 'active',
                approved: true
            }]);

        if (profileError) {
            console.error('Profile creation error:', profileError);
            alert('❌ Error creating profile: ' + profileError.message);
            return;
        }

        alert('✅ Account created successfully! Please login.');
        window.location.href = 'login.html';

    } catch (error) {
        console.error('Signup error:', error);
        alert('❌ An error occurred during signup: ' + error.message);
    }
}

// Signup Therapist Function
async function signupTherapist(email, password, name, phone, specialization, qualifications, bio) {
    try {
        // Step 1: Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (authError) {
            alert('❌ Signup failed: ' + authError.message);
            return;
        }

        // Step 2: Create profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: authData.user.id,
                email: email,
                full_name: name,
                phone: phone,
                role: 'therapist',
                status: 'active',
                approved: false
            }]);

        if (profileError) {
            console.error('Profile creation error:', profileError);
            alert('❌ Error creating profile: ' + profileError.message);
            return;
        }

        // Step 3: Create therapist record
        const { error: therapistError } = await supabase
            .from('Therapists')
            .insert([{
                user_id: authData.user.id,
                Name: name,
                email: email,
                phone: phone,
                Specialization: specialization,
                qualifications: qualifications,
                bio: bio,
                approval_status: 'pending',
                Active: true
            }]);

        if (therapistError) {
            console.error('Therapist creation error:', therapistError);
            alert('❌ Error creating therapist profile: ' + therapistError.message);
            return;
        }

        alert('✅ Therapist account created! Please wait for admin approval before logging in.');
        window.location.href = 'login.html';

    } catch (error) {
        console.error('Therapist signup error:', error);
        alert('❌ An error occurred during signup: ' + error.message);
    }
}

// Check if user is already logged in
function checkAuth() {
    const user = localStorage.getItem('user');
    if (user) {
        const userData = JSON.parse(user);
        
        // Redirect to appropriate dashboard
        if (userData.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else if (userData.role === 'therapist') {
            window.location.href = 'therapist-dashboard.html';
        } else if (userData.role === 'user') {
            window.location.href = 'user-dashboard.html';
        }
    }
}

// Logout Function
function logout() {
    localStorage.removeItem('user');
    supabase.auth.signOut();
    window.location.href = 'login.html';
}
