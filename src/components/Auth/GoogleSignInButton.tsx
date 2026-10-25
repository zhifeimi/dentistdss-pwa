import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import authAPI from '../../services/auth';

type GoogleButtonTheme = 'outline' | 'filled_blue' | 'filled_black';

interface GoogleSignInButtonProps {
  onSuccess: (response: CredentialResponse, nonce: string) => Promise<void> | void;
  onError: () => void;
  width: string;
  theme: GoogleButtonTheme;
}

/** Prepares and binds Google's ID token to the backend's one-time nonce. */
const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  width,
  theme,
}) => {
  const [nonce, setNonce] = useState<string | null>(null);
  const [challengeError, setChallengeError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);
  const mounted = useRef(false);

  const prepareNonce = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setRefreshing(true);
    setChallengeError(false);
    setNonce(null);
    try {
      const nextNonce = await authAPI.getGoogleNonce();
      if (mounted.current && currentRequest === requestId.current) setNonce(nextNonce);
    } catch (_) {
      if (mounted.current && currentRequest === requestId.current) setChallengeError(true);
    } finally {
      if (mounted.current && currentRequest === requestId.current) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void prepareNonce();
    return () => {
      mounted.current = false;
      requestId.current += 1;
    };
  }, [prepareNonce]);

  const handleSuccess = async (response: CredentialResponse) => {
    if (!nonce) return;
    setNonce(null);
    try {
      await onSuccess(response, nonce);
    } catch (_) {
      // The page callback owns user-visible exchange errors.
    } finally {
      if (mounted.current) void prepareNonce();
    }
  };

  const handleError = () => {
    onError();
    if (mounted.current) void prepareNonce();
  };

  if (challengeError) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <Typography color='error' variant='body2' role='alert'>
          Could not prepare Google sign-in. Check your connection and retry.
        </Typography>
        <Button onClick={() => void prepareNonce()} disabled={refreshing}>
          {refreshing ? <CircularProgress size={20} /> : 'Retry Google sign-in'}
        </Button>
      </Box>
    );
  }

  if (!nonce) {
    return <CircularProgress size={24} aria-label='Preparing Google sign-in' />;
  }

  return (
    <GoogleLogin
      key={nonce}
      nonce={nonce}
      size='large'
      width={width}
      onSuccess={handleSuccess}
      onError={handleError}
      useOneTap={false}
      text='continue_with'
      type='standard'
      shape='rectangular'
      theme={theme}
      logo_alignment='left'
    />
  );
};

export default GoogleSignInButton;
