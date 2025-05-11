import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import AdvisorDashboard from './pages/AdvisorDashboard';
import ScheduleMeeting from './pages/ScheduleMeeting';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<AdvisorDashboard />} />
          <Route path="/schedule/:linkId" element={<ScheduleMeeting />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
