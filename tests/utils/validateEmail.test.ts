import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import useFormValidation from '../../src/hooks/useFormValidation';

const validateEmail = (email: string) => renderHook(() => useFormValidation()).result.current.validateEmail(email);

describe('validateEmail', () => {
  it.each(['sam@harbour.com.au', 'sam@smile.dental', 'sam+clinic@gmail.com', "o'neil@clinic.health"])(
    'accepts %s',
    (email) => {
      expect(validateEmail(email)).toBe('');
    },
  );

  it.each(['sam', 'sam@', 'sam@clinic', 'sam@clinic.c', 'sam @clinic.com', 'sam@@clinic.com'])(
    'rejects %s',
    (email) => {
      expect(validateEmail(email)).toBe('Please enter a valid email address');
    },
  );
});
