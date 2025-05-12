
# Calendal Tool

A Calendly-like scheduling application that integrates with Google Calendar and HubSpot CRM, allowing users to connect accounts, fetch events and contacts, create scheduling windows, and manage meetings.

## Features

- **Google Calendar Integration**: Connect multiple Google accounts using OAuth to fetch calendar events and create new meetings.
- **HubSpot CRM Integration**: Connect HubSpot accounts to fetch contacts and display them alongside calendar events.
- **Scheduling Windows**: Create scheduling windows with availability rows specifying weekdays, start hours, and end hours for flexible meeting scheduling.
- **Meeting Management**: View scheduled meetings and connected accounts in a dashboard, with options to connect additional accounts and sign out.
- **Responsive UI**: A React-based frontend with navigation for creating scheduling windows, viewing meetings, and managing availability.
- **Secure Authentication**: Uses JWT for authentication and authorization, with token refresh logic for Google API access.

## Tech Stack

- **Backend**: NestJS, TypeScript, Mongoose (MongoDB), Google APIs, HubSpot API
- **Frontend**: React, TypeScript, Axios, React Router
- **Database**: MongoDB
- **Authentication**: OAuth 2.0 (Google, HubSpot), JWT
- **Environment**: Node.js, npm

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (running locally on `mongodb://localhost:27017`)
- Google Cloud Project with OAuth credentials (Client ID, Client Secret)
- HubSpot Developer Account with OAuth app credentials (Client ID, Client Secret)

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/Faith-qa/calendal-tool.git
cd calendal-tool
git checkout feature/frontend
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory with the following variables:
   ```plaintext
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
   HUBSPOT_CLIENT_ID=your-hubspot-client-id
   HUBSPOT_CLIENT_SECRET=your-hubspot-client-secret
   HUBSPOT_CALLBACK_URL=http://localhost:3000/api/auth/hubspot/callback
   JWT_SECRET=your-jwt-secret
   SMTP_HOST=your-smtp-host
   SMTP_PORT=587
   SMTP_USER=your-smtp-user
   SMTP_PASS=your-smtp-pass
   SMTP_FROM=your-email@example.com
   ADVISOR_EMAIL=advisor-email@example.com
   GOOGLE_ACCESS_TOKEN=optional-google-access-token
   LINKEDIN_SCRAPING_SERVICE_URL=optional-linkedin-scraping-url
   ```
    - Replace placeholders with your actual credentials.
    - Ensure MongoDB is running locally (`mongodb://localhost:27017/calendly-tool`).
4. Start the backend:
   ```bash
   npm start
   ```
    - The backend will run on `http://localhost:3000`.

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` directory with the following variable:
   ```plaintext
   REACT_APP_API_BASE_URL=http://localhost:3000/api
   ```
    - This points the frontend to the backend API with the `/api` prefix.
4. Start the frontend:
   ```bash
   npm start
   ```
    - The frontend will run on `http://localhost:5001`.

## Usage

1. **Sign In**:
    - Open `http://localhost:5001` in your browser.
    - Click "Sign in with Google" to authenticate using your Google account.

2. **Dashboard**:
    - After signing in, you’ll be redirected to `/dashboard`.
    - The dashboard displays:
        - Connected Google and HubSpot accounts.
        - Scheduled meetings fetched from Google Calendar.
        - HubSpot contacts.

3. **Connect Additional Accounts**:
    - Click "Connect Another Google Account" to add more Google accounts.
    - Click "Connect HubSpot Account" to connect a HubSpot account via OAuth.

4. **Create Scheduling Windows**:
    - From the dashboard, click "Create Scheduling Window".
    - Add availability rows specifying the weekday, start hour, and end hour.
    - Submit to save the scheduling window.
    - Click "View Scheduling Windows" to see all windows and delete if needed.

5. **Schedule a Meeting**:
    - Navigate to `/schedule` to book a meeting by selecting an available slot.

## API Endpoints

### Authentication
- `POST /api/auth/google`: Initiate Google OAuth flow.
- `GET /api/auth/google/callback`: Google OAuth callback.
- `GET /api/auth/google/connect`: Connect additional Google accounts.
- `GET /api/auth/hubspot`: Initiate HubSpot OAuth flow.
- `GET /api/auth/hubspot/callback`: HubSpot OAuth callback.
- `GET /api/auth/hubspot/connect`: Connect additional HubSpot accounts.

### Meetings
- `GET /api/meetings`: Fetch calendar events and HubSpot contacts.
- `POST /api/meetings/book`: Book a meeting by creating a Google Calendar event.

### Scheduling Windows
- `POST /api/scheduling/windows`: Create a new scheduling window.
    - Body: `{"availabilityRows":[{"weekday":"Monday","startHour":9,"endHour":17}]}`
- `GET /api/scheduling/windows`: Retrieve all scheduling windows for the user.
- `DELETE /api/scheduling/windows/:id`: Delete a specific scheduling window.

### Calendar
- `GET /api/calendar/available-slots`: Fetch available time slots for booking.

## Testing with `curl`

1. **Obtain a JWT Token**:
    - Sign in through the frontend and extract the token from the redirect URL (`http://localhost:5001?token=YOUR_JWT_TOKEN`).

2. **Create a Scheduling Window**:
   ```bash
   curl -X POST "http://localhost:3000/api/scheduling/windows" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"availabilityRows":[{"weekday":"Monday","startHour":9,"endHour":17},{"weekday":"Wednesday","startHour":10,"endHour":14}]}'
   ```

3. **Get Scheduling Windows**:
   ```bash
   curl -X GET "http://localhost:3000/api/scheduling/windows" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

4. **Delete a Scheduling Window**:
   ```bash
   curl -X DELETE "http://localhost:3000/api/scheduling/windows/SCHEDULING_WINDOW_ID" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## Project Structure

- **backend/**: NestJS backend application.
    - `src/auth/`: Authentication logic (Google, HubSpot, JWT).
    - `src/calendar/`: Google Calendar integration.
    - `src/meetings/`: Meeting management and HubSpot contact fetching.
    - `src/scheduling/`: Scheduling windows and links.
    - `src/shared/`: Shared services (e.g., `CalendarService` to avoid circular dependencies).
- **frontend/**: React frontend application.
    - `src/components/`: Reusable components (e.g., `MeetingList`, `SchedulingWindowForm`).
    - `src/pages/`: Page components (e.g., `AdvisorDashboard`, `Login`).
    - `src/contexts/`: React context for authentication state.

## Next Steps

- **Filter Available Slots with Scheduling Windows**: Modify `/api/calendar/available-slots` to use scheduling windows for determining availability.
- **Booking with HubSpot Contacts**: Allow users to select HubSpot contacts when booking meetings.
- **Deployment**: Deploy the app to Fly.io for public access.
- **UI/UX Enhancements**: Add a calendar view for events, loading spinners, and better error handling.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Make your changes and commit (`git commit -m "Add your feature"`).
4. Push to your branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

## License

This project is licensed under the MIT License.

---
