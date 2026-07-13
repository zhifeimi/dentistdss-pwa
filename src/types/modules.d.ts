// Declaration file for modules that haven't been converted to TypeScript yet

declare module './components/GlobalSnackbar' {
  const GlobalSnackbar: React.ComponentType<any>;
  export default GlobalSnackbar;
}

declare module './components/AppShell' {
  const AppShell: React.ComponentType<any>;
  export default AppShell;
}

declare module './components/NotificationSystem' {
  export const NotificationProvider: React.ComponentType<{ children: React.ReactNode }>;
}

declare module '../pages/Dashboard/ChatBotDentist' {
  const ChatInterface: React.ComponentType<any>;
  export default ChatInterface;
}

declare module '../pages/Home/Login' {
  const Login: React.ComponentType<any>;
  export default Login;
}

declare module '../pages/Home/Signup' {
  const Signup: React.ComponentType<any>;
  export default Signup;
}

declare module '../pages/Home/Welcome' {
  const Welcome: React.ComponentType<any>;
  export default Welcome;
}

declare module '../pages/Home/Book' {
  const Book: React.ComponentType<any>;
  export default Book;
}

declare module '../pages/Home/Learn' {
  const Learn: React.ComponentType<any>;
  export default Learn;
}

declare module '../pages/Home/Signup/ClinicStaff' {
  const ClinicStaffSignup: React.ComponentType<any>;
  export default ClinicStaffSignup;
}

declare module '../pages/Home/Signup/ClinicAdmin' {
  const ClinicAdminSignup: React.ComponentType<any>;
  export default ClinicAdminSignup;
}

declare module '../pages/VerifyEmail/Code' {
  const VerifyEmailPendingPage: React.ComponentType<any>;
  export default VerifyEmailPendingPage;
}

declare module '../pages/VerifyEmail/Token' {
  const VerifyEmailPage: React.ComponentType<any>;
  export default VerifyEmailPage;
}

declare module '../pages/TermsAndConditions' {
  const TermsAndConditions: React.ComponentType<any>;
  export default TermsAndConditions;
}

declare module '../pages/Home/Quiz' {
  const QuizPage: React.ComponentType<any>;
  export default QuizPage;
}

declare module '../pages/Home/FindAClinic' {
  const FindAClinic: React.ComponentType<any>;
  export default FindAClinic;
}

declare module '../../pages/Dashboard' {
  export const AppointmentsPage: React.ComponentType<any>;
  export const MessagesPage: React.ComponentType<any>;
  export const UserManagementPage: React.ComponentType<any>;
  export const ApprovalsPage: React.ComponentType<any>;
  export const SettingsPage: React.ComponentType<any>;
  export const OverviewPage: React.ComponentType<any>;
  export const DentalRecordsPage: React.ComponentType<any>;
  export const PatientRecordsPage: React.ComponentType<any>;
  export const ProfilePage: React.ComponentType<any>;
  export const PatientsPage: React.ComponentType<any>;
  export const CommunicationsPage: React.ComponentType<any>;
  export const SchedulePage: React.ComponentType<any>;
  export const AIReceptionistPage: React.ComponentType<any>;
  export const AIDentistPage: React.ComponentType<any>;
  export const AISummarizePage: React.ComponentType<any>;
}

declare module '../utils/httpErrorMessages' {
  export function getHttpErrorMessage(status: number): string;
}

declare module '../components/Dashboard/DashboardLayout' {
  const DashboardLayout: React.ComponentType<any>;
  export default DashboardLayout;
}
