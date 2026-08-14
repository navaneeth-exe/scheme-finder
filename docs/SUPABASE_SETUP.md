# Supabase Setup Guide

To transition SATURNX from "Mock Mode" to the "Original Working Model" (real authentication and live database), follow these steps:

## 1. Create a Supabase Project
1. Go to [Supabase](https://supabase.com) and create an account if you don't have one.
2. Click **New Project**.
3. Choose an organization, give your project a name (e.g., `saturnx`), and set a strong database password.
4. Select a region closest to you and click **Create new project**. It will take a few minutes for the database to provision.

## 2. Get Your API Keys
1. Once the project is ready, go to **Project Settings** (gear icon in the bottom left).
2. Click on **API** in the sidebar.
3. You will need two values:
   - **Project URL**
   - **Project API Key (anon / public)**

## 3. Configure Your Local Environment
1. In the root directory of your project, create a file named `.env.local` (or rename `.env.local.example` to `.env.local`).
2. Add your keys to the file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## 4. Run the Database Migrations
SATURNX uses PostgreSQL. We need to create the tables in your new database.
1. Go to your Supabase Dashboard.
2. Click on **SQL Editor** in the left sidebar.
3. Click **New query**.
4. Open the file `supabase/migrations/0000_initial_schema.sql` in your code editor, copy all of its contents, and paste it into the Supabase SQL Editor.
5. Click **Run** (or press Cmd/Ctrl + Enter). This will create all the necessary tables (users, family_members, schemes, applications, etc.) and set up Row Level Security.

## 5. Seed the Initial Data
To populate the database with the core welfare schemes:
1. Make sure your local Next.js server is running (`npm run dev`).
2. Open your web browser and go to: `http://localhost:3000/api/seed`
3. You should see a JSON response `{"success": true}`. 

## 6. Enable Email Authentication
1. Go to your Supabase Dashboard.
2. Click on **Authentication** in the left sidebar.
3. Go to **Providers** and ensure **Email** is enabled.
4. (Optional) For the hackathon, you may want to go to **Auth > Providers > Email** and turn OFF "Confirm email" so you don't have to verify emails during the live demo.

## Testing the Real Model
That's it! If you go to `http://localhost:3000` and click **Get Started**, you will be directed to the Login/Signup page. Create a real account, and your profile, family, and documents will now persist securely in your live database!
