// Router state handed between the sign-up, verify-email, pending-approval and
// login pages. Browsers keep it across a reload, but a typed-in URL has none,
// so readers treat every field as possibly missing.

// Who reviews the sign-up: the clinic's admin (staff) or the DentistDSS team (new clinics)
export type Approver = 'clinic' | 'dentistdss';

// The protected page that sent a logged-out visitor to log in (see utils/returnPath)
export interface ReturnLocation {
  pathname?: string;
  search?: string;
}

// Staff and clinic-admin sign-ups must say who approves them: without it the
// verified account is sent to a login the backend refuses until approval
export interface ApprovalSignupState {
  email: string;
  firstName: string;
  approver: Approver;
}

// A patient sign-up carries the return page through verification
export interface PatientSignupState {
  email: string;
  firstName: string;
  from?: ReturnLocation;
}

// What /verify-email-code reads
export type VerifyEmailState = Partial<ApprovalSignupState & PatientSignupState>;

// What /pending-approval reads
export interface PendingApprovalState {
  firstName?: string;
  approver?: Approver;
}
