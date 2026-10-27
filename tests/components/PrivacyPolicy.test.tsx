import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import PrivacyPolicy from '../../src/pages/PrivacyPolicy';

vi.unmock('react-router');

const sections = [
  ['data-we-collect', '1. Information we collect'],
  ['google-user-data', '2. Google user data and OAuth scopes'],
  ['how-we-use-data', '3. How we use information'],
  ['storage-retention', '4. Storage and retention'],
  ['sharing', '5. Who we share information with'],
  ['ai-processing', '6. AI processing and model training'],
  ['your-choices', '7. Your choices and data rights'],
  ['security', '8. How we protect information'],
  ['cookies', '9. Cookies and browser storage'],
  ['international-transfers', '10. International data transfers'],
  ['policy-changes', '11. Changes to this policy'],
  ['contact', '12. Contact us'],
] as const;

const renderPolicy = () => {
  render(
    <MemoryRouter initialEntries={['/privacy']}>
      <PrivacyPolicy />
    </MemoryRouter>,
  );
  return screen.getByRole('main');
};

describe('Privacy policy', () => {
  it('renders a draft without an effective date and preserves the original sections and anchors', () => {
    const policy = renderPolicy();

    expect(screen.getByRole('heading', { level: 1, name: 'DentistDSS Privacy Policy' })).toBeVisible();
    expect(policy).toHaveTextContent(/draft/i);
    expect(policy).not.toHaveTextContent(/effective date\s*:/i);

    const navigation = screen.getByRole('navigation', { name: 'Privacy policy sections' });
    expect(within(navigation).getAllByRole('link')).toHaveLength(sections.length);

    for (const [id, name] of sections) {
      const heading = screen.getByRole('heading', { level: 2, name });
      expect(heading).toHaveAttribute('id', `${id}-heading`);
      expect(document.getElementById(id)).toContainElement(heading);
      expect(within(navigation).getByRole('link', { name: name.replace(/^\d+\. /, '') }))
        .toHaveAttribute('href', `#${id}`);
    }
  });

  it('retains the Google sign-in and Maps disclosures and other provider and security commitments', () => {
    const policy = renderPolicy();

    for (const scope of ['openid', 'email', 'profile']) {
      expect(screen.getAllByText(scope, { selector: 'code' }).length).toBeGreaterThan(0);
    }
    for (const disclosure of [
      'Google Sign-In',
      'Google Maps',
      'Clinical records and images',
      'Chatbot and AI content',
      'Quiz answers',
      'Technical and security information',
      'Vercel (web hosting)',
      'Cloudflare (network and security infrastructure)',
      'SMTP email delivery provider',
      'Your clinic and authorized users',
      'we do not read or store your full name',
      'expires after five minutes',
      'Refresh cookies and sessions last up to 30 days',
      'codes expire after ten minutes',
      'does not automatically expire or periodically delete these records',
      'the current interface does not provide self-service deletion for an entire account',
    ]) {
      expect(policy).toHaveTextContent(disclosure);
    }
    expect(screen.getByRole('link', { name: 'Google Account third-party access settings' }))
      .toHaveAttribute('href', 'https://myaccount.google.com/permissions');
    expect(screen.getAllByRole('link', { name: 'dentistdss@gmail.com' })[0])
      .toHaveAttribute('href', 'mailto:dentistdss@gmail.com');
    expect(policy).not.toHaveTextContent('HIPAA- and GDPR-compliant');
  });

  it('describes the self-hosted AI endpoint and OpenAI as its upstream provider', () => {
    const policy = renderPolicy();
    const sharing = screen.getByRole('heading', { level: 2, name: '5. Who we share information with' })
      .closest('section')!;
    const ai = screen.getByRole('heading', { level: 2, name: '6. AI processing and model training' })
      .closest('section')!;

    for (const section of [sharing, ai]) {
      expect(section).toHaveTextContent(/configured.{0,40}self.hosted.{0,40}openai.compatible.{0,40}endpoint/i);
      expect(section).toHaveTextContent(
        /current prompt.{0,50}recent conversation messages.{0,50}relevant prompt.template context.{0,100}endpoint.{0,40}forwards.{0,30}openai.{0,30}upstream provider/i,
      );
      expect(section).not.toHaveTextContent(
        /openai[^.]*\b(?:train(?:s|ing)?|fine.tun(?:e|ing)|retention|retain(?:s|ed)?|located|business associate agreement|baa)\b/i,
      );
      expect(section).not.toHaveTextContent(/no (?:other|further|additional) (?:third.parties|providers)/i);
    }
    expect(ai).toHaveTextContent(/openai.compatible.{0,60}(?:describes|refers to).{0,30}interface/i);
    expect(ai).toHaveTextContent(/term alone does not identify.{0,30}provider.{0,40}openai operates the endpoint/i);
    expect(policy).not.toHaveTextContent(/vertex ai|gemini/i);
    expect(policy).not.toHaveTextContent(/google cloud.{0,100}data.governance/i);
    expect(policy.querySelector('a[href*="cloud.google.com/vertex-ai"]')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /google cloud.*data.governance/i }))
      .not.toBeInTheDocument();
    expect(ai).toHaveTextContent(/dentistdss does not.{0,250}(?:train|fine.tune).{0,80}(?:its|our) own (?:ai )?models/i);
  });

  it('distinguishes configurable conversation defaults from separate interaction records', () => {
    renderPolicy();

    const retention = screen.getByRole('heading', { level: 2, name: '4. Storage and retention' })
      .closest('section')!;
    const ai = screen.getByRole('heading', { level: 2, name: '6. AI processing and model training' })
      .closest('section')!;

    expect(retention).toHaveTextContent(/(?:default.{0,100}\b(?:50|fifty)\b|\b(?:50|fifty)\b.{0,100}default)/i);
    expect(retention).toHaveTextContent(/configur/i);
    expect(retention).toHaveTextContent(/separate.{0,100}interaction|interaction.{0,100}separate/i);
    expect(retention).toHaveTextContent(/without.{0,60}(?:50|fifty|conversation).{0,30}(?:cap|limit)/i);
    expect(ai).toHaveTextContent(/(?:default.{0,100}\b(?:10|ten)\b|\b(?:10|ten)\b.{0,100}default)/i);
    expect(ai).toHaveTextContent(/configur/i);
    expect(ai).toHaveTextContent(/built.in prompts?.{0,150}do not include.{0,100}user id.{0,40}clinic id.{0,40}session id/i);
    expect(ai).toHaveTextContent(/custom prompt templates.{0,40}(?:may|can).{0,50}clinic.{0,30}session identifiers/i);
  });
});
