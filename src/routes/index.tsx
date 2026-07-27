import React from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { Typography } from '@mui/material';
import ChatInterface from '../pages/Dashboard/ChatBotDentist';
import Login from '../pages/Home/Login';
import Signup from '../pages/Home/Signup';
import Welcome from '../pages/Home/Welcome';
import Book from '../pages/Home/Book';
import Learn from '../pages/Home/Learn';
import ClinicStaffSignup from '../pages/Home/Signup/ClinicStaff';
import VerifyEmailPendingPage from '../pages/VerifyEmail/Code';
import VerifyEmailPage from '../pages/VerifyEmail/Token';

import QuizPage from '../pages/Home/Quiz';
import FindAClinic from '@/pages/Home/FindAClinic';
import ClinicAdminSignup from '../pages/Home/Signup/ClinicAdmin';
import { useAuth } from '../context/auth';
import config from '../config';
import TermsAndConditions from '../pages/TermsAndConditions';

const AppRoutes: React.FC = () => {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            <Route
                path="/login"
                element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />}
            />
            <Route
                path="/signup"
                element={!isAuthenticated ? <Signup /> : <Navigate to="/dashboard" replace />}
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
            <Route
                path="/chat"
                element={
                    isAuthenticated ? (
                        <>
                            <Typography
                                variant="h4"
                                component="h1"
                                gutterBottom
                                align="center"
                                sx={{
                                    mb: { xs: 2, sm: 3, md: 4 },
                                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' }
                                }}
                            >
                                {config.app.name} - Your Dental Assistant
                            </Typography>
                            <ChatInterface />
                        </>
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />
            {/* Dashboard routes are now handled by AppShell based on public location dictionary */}
            <Route
                path="/dashboard/*"
                element={isAuthenticated ? null : <Navigate to="/login" replace />}
            />
            <Route
                path="/pending-approval"
                element={<Typography variant="h5" align="center" sx={{ mt: 4 }}>Your account is pending approval. Please check
                    your email or contact support.</Typography>}
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
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default AppRoutes;