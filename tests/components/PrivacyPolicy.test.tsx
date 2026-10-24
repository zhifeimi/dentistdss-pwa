import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TermsAndConditions from '../../src/pages/TermsAndConditions';

const renderPolicy = () => {
  render(<TermsAndConditions />);
  return screen.getByRole('main');
};

describe('Privacy policy', () => {
  it('renders a dated policy with all required sections', () => {
    renderPolicy();

    expect(screen.getByRole('heading', { level: 1, name: 'DentistDSS Privacy Policy' })).toBeVisible();
    expect(screen.getByText('Effective date: 24 October 2026')).toBeInTheDocument();

    const sections = [
      '1. Information we collect',
      '2. Google user data and OAuth scopes',
      '3. How we use information',
      '4. Storage and retention',
      '5. Who we share information with',
      '6. AI processing and model training',
      '7. Your choices and data rights',
      '8. How we protect information',
      '9. Cookies and browser storage',
      '10. International data transfers',
      '11. Changes to this policy',
      '12. Contact us',
    ];

    for (const name of sections) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    }
  });

  it('links every table-of-contents item to an existing section', () => {
    renderPolicy();

    const navigation = screen.getByRole('navigation', { name: 'Privacy policy sections' });
    const links = navigation.querySelectorAll('a');
    expect(links).toHaveLength(12);

    for (const link of links) {
      const id = link.getAttribute('href')?.replace(/^#/, '');
      expect(id).toBeTruthy();
      expect(document.getElementById(id!)).not.toBeNull();
    }
  });

  it('identifies Google scopes, collected data, and service providers', () => {
    const policy = renderPolicy();

    for (const scope of ['openid', 'email', 'profile']) {
      expect(screen.getAllByText(scope, { selector: 'code' }).length).toBeGreaterThan(0);
    }

    expect(policy).toHaveTextContent('Clinical records and images');
    expect(policy).toHaveTextContent('Chatbot and AI content');
    expect(policy).toHaveTextContent('Quiz answers');
    expect(policy).toHaveTextContent('Technical and security information');
    expect(policy).toHaveTextContent('Vercel (web hosting)');
    expect(policy).toHaveTextContent('Cloudflare (network and security infrastructure)');
    expect(policy).toHaveTextContent('SMTP email delivery provider');
    expect(policy).toHaveTextContent('Your clinic and authorized users');
  });

  it('explains conditional AI processing, training, deletion, and Google revocation', () => {
    const policy = renderPolicy();

    expect(policy).toHaveTextContent('Where the GenAI service is enabled and configured');
    expect(policy).toHaveTextContent('Google Cloud Vertex AI');
    expect(policy).toHaveTextContent('up to ten recent conversation messages');
    expect(policy).toHaveTextContent(
      'DentistDSS does not use your prompts, responses, Google Sign-In information, clinical records, or images to train or fine-tune its own AI models',
    );
    expect(policy).toHaveTextContent(
      'the current interface does not provide self-service deletion for an entire account',
    );
    expect(screen.getByRole('link', { name: 'Google Account third-party access settings' })).toHaveAttribute(
      'href',
      'https://myaccount.google.com/permissions',
    );
    expect(screen.getByRole('link', { name: /Google Cloud's generative AI data-governance/ })).toHaveAttribute(
      'href',
      'https://cloud.google.com/vertex-ai/generative-ai/docs/data-governance',
    );
  });

  it('states precise Google data, credential, and retention limits', () => {
    const policy = renderPolicy();

    expect(policy).toHaveTextContent('we do not read or store your full name');
    expect(policy).toHaveTextContent('or the DentistDSS account database');
    expect(policy).toHaveTextContent('expires after five minutes');
    expect(policy).toHaveTextContent('Refresh cookies and sessions last up to 30 days');
    expect(policy).toHaveTextContent('only its latest 50 messages');
    expect(policy).toHaveTextContent('without the 50-message cap');
    expect(policy).toHaveTextContent('codes expire after ten minutes');
    expect(policy).toHaveTextContent(
      'does not automatically expire or periodically delete these records',
    );
  });

  it('keeps the terms without the former unsupported compliance claim', () => {
    const policy = renderPolicy();

    expect(screen.getByRole('heading', { level: 2, name: 'Terms and Conditions' })).toBeInTheDocument();
    expect(policy).not.toHaveTextContent('HIPAA- and GDPR-compliant');
    expect(screen.getAllByRole('link', { name: 'dentistdss@gmail.com' })[0]).toHaveAttribute(
      'href',
      'mailto:dentistdss@gmail.com',
    );
  });
});
