// Password strength utility functions

interface PasswordStrengthResult {
  score: number;
  level: 'none' | 'weak' | 'medium' | 'strong';
  feedback: string[];
}

interface Theme {
  palette: {
    success: { main: string };
    warning: { main: string };
    error: { main: string };
    grey: { [key: number]: string };
  };
}

export const calculatePasswordStrength = (password: string): PasswordStrengthResult => {
  if (!password) return {score: 0, level: 'none', feedback: []};

  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('At least 8 characters');
  }

  if (password.length >= 12) {
    score += 1;
  }

  // Lowercase letters
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add lowercase letters');
  }

  // Uppercase letters
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add uppercase letters');
  }

  // Numbers
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add numbers');
  }

  // Special characters
  if (/[^A-Za-z0-9\s]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add special characters');
  }

  if (/\s/.test(password)) {
    feedback.push('Remove whitespace');
  }

  if (password.length > 128) {
    feedback.push('Use no more than 128 characters');
  }

  // Only call a password strong when it satisfies the backend policy.
  let level = 'weak';
  if (isPasswordStrong(password)) {
    level = 'strong';
  } else if (score >= 3) {
    level = 'medium';
  }

  return {score, level: level as 'none' | 'weak' | 'medium' | 'strong', feedback};
};

export const getPasswordStrengthColor = (level: string, theme: Theme): string => {
  switch (level) {
    case 'strong':
      return theme.palette.success.main;
    case 'medium':
      return theme.palette.warning.main;
    case 'weak':
      return theme.palette.error.main;
    default:
      return theme.palette.grey[400];
  }
};

export const isPasswordStrong = (password: string): boolean =>
  password.length >= 8 &&
  password.length <= 128 &&
  !/\s/.test(password) &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9\s]/.test(password);