# Google OAuth Setup (5 minutes)

1. Open https://console.cloud.google.com/apis/credentials
2. Create a project (e.g. "Arthiq") if you don't have one
3. Go to **OAuth consent screen** → External → fill app name "Arthiq" → add your Gmail as test user
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Authorized redirect URIs (use port **5173** so login cookies work in dev):
   ```
   http://localhost:5173/api/auth/google/callback
   ```
7. Copy **Client ID** and **Client Secret** into `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=paste_here
   GOOGLE_CLIENT_SECRET=paste_here
   ```
8. Restart the backend server
