import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/auth';
import RouteFallback from '../components/RouteFallback';
import { returnPathAfterLogin } from '../utils/returnPath';

// Route-level code splitting: every page is a lazy chunk so the anonymous first
// view does not pay for dashboard, calendar, maps, markdown, or Learn assets.
// Directory pages import their index.tsx directly to avoid barrel hazards.
const Login = React.lazy(() => import('../pages/Home/Login/index.tsx'));
const Signup = React.lazy(() => import('../pages/Home/Signup/index.tsx'));
const Welcome = React.lazy(() => import('../pages/Home/Welcome/index.tsx'));
const Book = React.lazy(() => import('../pages/Home/Book/index.tsx'));
const Learn = React.lazy(() => import('../pages/Home/Learn/index.tsx'));
const ClinicStaffSignup = React.lazy(() => import('../pages/Home/Signup/ClinicStaff/index.tsx'));
const VerifyEmailPendingPage = React.lazy(() => import('../pages/VerifyEmail/Code/index.tsx'));
const VerifyEmailPage = React.lazy(() => import('../pages/VerifyEmail/Token/index.tsx'));
const QuizPage = React.lazy(() => import('../pages/Home/Quiz/index.tsx'));
const FindAClinic = React.lazy(() => import('../pages/Home/FindAClinic/index.tsx'));
const ClinicAdminSignup = React.lazy(() => import('../pages/Home/Signup/ClinicAdmin/index.tsx'));
const TermsAndConditions = React.lazy(() => import('../pages/TermsAndConditions/index.tsx'));
const PrivacyPolicy = React.lazy(() => import('../pages/PrivacyPolicy/index.tsx'));
const PendingApproval = React.lazy(() => import('../pages/PendingApproval/index.tsx'));

const AppRoutes: React.FC = () => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    return (
        <Suspense fallback={<RouteFallback />}>
            <Routes>
                <Route
                    path="/login"
                    element={!isAuthenticated ? <Login /> : <Navigate to={returnPathAfterLogin(location.state)} replace />}
                />
                <Route
                    path="/signup"
                    element={!isAuthenticated ? <Signup /> : <Navigate to={returnPathAfterLogin(location.state)} replace />}
                />
                <Route
                    path="/signup/clinic-staff"
                    element={!isAuthenticated ? <ClinicStaffSignup /> : <Navigate to="/dashboard" replace />}
                />
                <Route
                    path="/verify-email-code"
                    element={<VerifyEmailPendingPage />}
                />
                <Route
                    path="/signup/verify"
                    element={<VerifyEmailPage />}
                />
                <Route
                    path="/"
                    element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Welcome />}
                />
                <Route
                    path="/book"
                    element={<Book />}
                />
                <Route
                    path="/learn"
                    element={<Learn />}
                />
                <Route
                    path="/quiz"
                    element={<QuizPage />}
                />
                {/* Dashboard routes are now handled by AppShell based on public location dictionary */}
                <Route
                    path="/dashboard/*"
                    element={loading || isAuthenticated ? null : <Navigate to="/login" replace />}
                />
                <Route
                    path="/pending-approval"
                    element={<PendingApproval />}
                />
                <Route
                    path="/find-a-clinic"
                    element={<FindAClinic />}
                />
                <Route
                    path="/signup/clinic-admin"
                    element={!isAuthenticated ? <ClinicAdminSignup /> : <Navigate to="/dashboard" replace />}
                />
                <Route
                    path="/terms"
                    element={<TermsAndConditions />}
                />
                <Route
                    path="/privacy"
                    element={<PrivacyPolicy />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
}

export default AppRoutes;
