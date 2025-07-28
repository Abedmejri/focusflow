import { Routes, Route } from 'react-router-dom';

// Import Layouts and Route Guards
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Import Page Components
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage'; // For completeness
import UpdatePasswordPage from './pages/UpdatePasswordPage'; // For completeness
import DashboardPage from './pages/DashboardPage';
import GoalsPage from './pages/GoalsPage';
import RoutinesPage from './pages/RoutinesPage';
import AICoachPage from './pages/AICoachPage';
import JournalPage from './pages/JournalPage';
import DonationPage from './pages/DonationPage';

function App() {
  return (
    <Routes>
      {/* === PUBLIC ROUTES === */}
      {/* These routes are accessible to anyone, logged in or not. */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/update-password" element={<UpdatePasswordPage />} />

      {/* === PROTECTED ROUTES === */}
      {/* These routes are only accessible after a user has logged in. */}
      {/* The ProtectedRoute component handles the authentication check. */}
      <Route element={<ProtectedRoute />}>
        {/* All routes inside here will share the main AppLayout (sidebar, header, etc.) */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/routines"element={<RoutinesPage />} />
          <Route path="/coach" element={<AICoachPage />} />
          <Route path="/journal" element={<JournalPage />} />
           <Route path="/donate" element={<DonationPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;