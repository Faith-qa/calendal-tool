import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import AdvisorDashboard from './pages/AdvisorDashboard';
import ScheduleMeeting from './pages/ScheduleMeeting';

const App: React.FC = () => {
  return (
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} /> {/* Add /login route */}
            <Route path="/dashboard" element={<AdvisorDashboard />} />
            <Route path="/schedule" element={<ScheduleMeeting />} />
          </Routes>
        </AuthProvider>
      </Router>
  );
};

export default App;