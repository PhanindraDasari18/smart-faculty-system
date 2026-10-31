# Smart Faculty Availability and Monitoring System

A simple MERN MVP for viewing faculty availability and updating faculty status.

## Requirements

- Node.js 18+
- MongoDB running locally

## Run the server

```bash
cd server
copy .env.example .env
npm install
npm run dev
```

Update `server/.env` if MongoDB uses a different connection string.

## Configure password reset emails

Password reset links are sent through Gmail SMTP. Use a dedicated Gmail sender account with 2-Step Verification enabled, then create an app password for this app. Add these values to `server/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-sender@gmail.com
SMTP_PASS=your-16-character-google-app-password
EMAIL_FROM=Smart Faculty System <your-sender@gmail.com>
CLIENT_URL=http://localhost:5173
```

Use the Google app password, not the Gmail account password. Remove spaces when entering it. Students enter an email when registering; faculty reset links go to the email already saved on the faculty record. Add email addresses to existing student records in MongoDB Compass before they can use password reset. Reset links expire after 30 minutes.

## Run the client

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173.

The frontend uses Vite's development proxy to send `/api` requests to the Express server on port 5000.
