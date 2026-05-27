-- SQL script to create the clinic_users table and insert seed admin credentials

CREATE TABLE IF NOT EXISTS clinic_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fullname TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert a default user (Altaf / altaf123596)
-- You can modify or add your own user credentials directly below
INSERT INTO clinic_users (username, password, fullname)
VALUES ('Altaf', 'altaf123596', 'Dr. Altaf Hussain')
ON CONFLICT (username) DO NOTHING;
