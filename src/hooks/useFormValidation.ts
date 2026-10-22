import { useState, useCallback } from 'react';

interface ValidationErrors {
  [fieldName: string]: string;
}

interface TouchedFields {
  [fieldName: string]: boolean;
}

interface FormData {
  [fieldName: string]: any;
  password?: string;
  confirmPassword?: string;
}

interface UseFormValidationReturn {
  validationErrors: ValidationErrors;
  touchedFields: TouchedFields;
  validateEmail: (email?: string) => string;
  validatePasswordConfirmation: (password?: string, confirmPassword?: string) => string;
  validateUrl: (url?: string) => string;
  validateField: (fieldName: string, value: any, formData?: FormData) => string;
  handleFieldChange: (fieldName: string, value: any, formData?: FormData) => void;
  handleFieldBlur: (fieldName: string, value: any, formData?: FormData) => void;
  isFormValid: (fieldsToCheck?: string[]) => boolean;
  getFieldError: (fieldName: string) => string;
  hasFieldError: (fieldName: string) => boolean;
  clearValidationErrors: () => void;
  clearFieldError: (fieldName: string) => void;
}

/**
 * Custom hook for form validation with real-time feedback
 *
 * Features:
 * - Email format validation
 * - Password confirmation validation
 * - Real-time validation on change and blur events
 * - Consistent error messaging
 * - Form validity state management
 */
const useFormValidation = (): UseFormValidationReturn => {
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({});

  /**
   * Validate email format
   */
  const validateEmail = useCallback((email?: string): string => {
    if (!email) {
      return 'Email is required';
    }
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  }, []);

  /**
   * Validate password confirmation
   */
  const validatePasswordConfirmation = useCallback((password?: string, confirmPassword?: string): string => {
    if (!confirmPassword) {
      return 'Please confirm your password';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return '';
  }, []);

  /**
   * Validate URL format
   */
  const validateUrl = useCallback((url?: string): string => {
    if (!url) {
      return ''; // URL is optional, so empty is valid
    }

    // Check if URL starts with http:// or https://
    const urlRegex = /^https?:\/\/.+/i;
    if (!urlRegex.test(url)) {
      return 'Please enter a valid URL starting with http:// or https://';
    }

    // Additional validation for basic URL structure
    try {
      new URL(url);
      return '';
    } catch {
      return 'Please enter a valid URL';
    }
  }, []);

  /**
   * Validate a specific field
   */
  const validateField = useCallback((fieldName: string, value: any, formData: FormData = {}): string => {
    let error = '';

    switch (fieldName) {
      case 'email':
      case 'businessEmail':
        error = validateEmail(value);
        break;
      case 'confirmPassword':
        error = validatePasswordConfirmation(formData.password || '', value);
        break;
      case 'website':
        error = validateUrl(value);
        break;
      default:
        // No specific validation for other fields
        break;
    }

    return error;
  }, [validateEmail, validatePasswordConfirmation, validateUrl]);

  /**
   * Handle field change with validation
   */
  const handleFieldChange = useCallback((fieldName: string, value: any, formData: FormData = {}): void => {
    // Only validate if field has been touched or if it's a password confirmation field
    if (touchedFields[fieldName] || fieldName === 'confirmPassword') {
      const error = validateField(fieldName, value, formData);
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
    }

    // Special case: if password changes, re-validate confirmPassword
    if (fieldName === 'password' && formData.confirmPassword && touchedFields.confirmPassword) {
      const confirmError = validatePasswordConfirmation(value, formData.confirmPassword);
      setValidationErrors(prev => ({
        ...prev,
        confirmPassword: confirmError
      }));
    }
  }, [touchedFields, validateField, validatePasswordConfirmation]);

  /**
   * Handle field blur with validation
   */
  const handleFieldBlur = useCallback((fieldName: string, value: any, formData: FormData = {}): void => {
    // Mark field as touched
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));

    // Validate the field
    const error = validateField(fieldName, value, formData);
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }, [validateField]);

  /**
   * Check if form has any validation errors
   */
  const isFormValid = useCallback((fieldsToCheck: string[] = []): boolean => {
    if (fieldsToCheck.length === 0) {
      // Check all errors
      return Object.values(validationErrors).every(error => !error);
    }

    // Check specific fields
    return fieldsToCheck.every(field => !validationErrors[field]);
  }, [validationErrors]);

  /**
   * Get error message for a specific field
   */
  const getFieldError = useCallback((fieldName: string): string => {
    return validationErrors[fieldName] || '';
  }, [validationErrors]);

  /**
   * Check if a field has an error
   */
  const hasFieldError = useCallback((fieldName: string): boolean => {
    return Boolean(validationErrors[fieldName]);
  }, [validationErrors]);

  /**
   * Clear all validation errors
   */
  const clearValidationErrors = useCallback((): void => {
    setValidationErrors({});
    setTouchedFields({});
  }, []);

  /**
   * Clear validation error for a specific field
   */
  const clearFieldError = useCallback((fieldName: string): void => {
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: ''
    }));
  }, []);

  return {
    validationErrors,
    touchedFields,
    validateEmail,
    validatePasswordConfirmation,
    validateUrl,
    validateField,
    handleFieldChange,
    handleFieldBlur,
    isFormValid,
    getFieldError,
    hasFieldError,
    clearValidationErrors,
    clearFieldError
  };
};

export default useFormValidation;
