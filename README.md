# Altaf Homeo Clinic & Pharmacy Management System

A highly polished, high-fidelity medical practice and pharmacy billing management application built with React, Vite, Tailwind CSS, and TypeScript. This application empowers doctors and pharmacists to manage patient queues, log clinical consultations, auto-generate responsive multi-lingual prescriptions, manage medicine inventory, track cash/bKash financial registers, and print receipts.

## Key Features

- **Clinic Authentication**: Beautiful gating sign-in screen connecting directly with Supabase database (or instant secure local-fallback check), storing user sessions temporarily inside the browser cache until manual Sign Out.
- **Patient Registration**: Searchable database tracking full names, demographic details, contact info, customized chronic condition checkboxes, drug allergies, and profile photos.
- **Consultation Desk**: Digital logs capturing chief complaints, precise clinical examination notes, vitals (BP, SpO2, Temperature, Weight, Pulse), ICD-10 diagnoses, and appointment visit categories.
- **Dynamic Prescription Engine**: Staggered auto-complete suggestions selecting medicine master catalogues. Custom dosing controls linked directly to instant print sheet previews in Bengali & English under **Altaf Homeo Clinic**.
- **Pharmacy & Stocks Ledger**: Live medicine batch stock tracker with adjustable thresholds, cost analysis, batch supplier, and expiry notices.
- **Billing & Register Desk**: Integrated checkout tracking total medicine charges, clinical discount, bKash or Credit Card transactional settlement methods, and outstanding due logs. 
- **Dynamic Accent Swatches**: Real-time theme visual customizer allowing custom slate levels and deep color visual setups.

## Tech Stack & Architecture

- **Frontend**: React 18 with high-speed Vite packaging.
- **Styling**: Tailwind CSS engine for fully responsive, elegant tablet layouts to supporting clinics.
- **Icons**: Lucide React.
- **State & Sync**: Single-file Context-API provider coupled with dual storage synchronization:
  - **Local Secure Vault**: A robust local cache preventing session data loss.
  - **Supabase Sync**: Secure PostgreSQL tables cloud synchronization for remote data backup.

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Database Setup for Login**:
   Run the SQL script provided in `/login_schema.sql` inside your Supabase SQL Editor. This will provision the `clinic_users` table and set up the default `admin` user with the password `admin123`.

3. **Environment Configuration**:
   Create a `.env` file in the root directory (using `.env.example` as a template) and configure your Supabase access credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

5. **Production Compilation**:
   ```bash
   npm run build
   ```

6. **Linter & Type Checking**:
   ```bash
   npm run lint
   ```

This project contains strictly typed variables, explicit structural TypeScript interfaces, and zero inline comments, maintaining elite code-cleanliness standard.
