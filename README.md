# Therapist Dashboard

A lightweight static dashboard built using HTML, CSS, and vanilla JavaScript, powered by Supabase.

## Features
- User authentication via Supabase
- View available therapists
- View bookings for the logged-in user only
- Secure row-level access using Supabase RLS
- No frontend frameworks (pure HTML/CSS/JS)

## Tech Stack
- HTML5
- CSS3
- JavaScript (Vanilla)
- Supabase (Auth + Database)

## Pages
- `index.html` — Landing page
- `login.html` — User login
- `dashboard.html` — Therapist list and user bookings

## Notes
- This is a static frontend project.
- All data access is handled via Supabase client SDK.
- Bookings are filtered by the authenticated user.

## Status
Core functionality complete.
