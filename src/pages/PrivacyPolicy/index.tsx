import React from 'react';
import { Box, Container, Link, Paper, Typography } from '@mui/material';
import { useLocation } from 'react-router';
import { getPrivacyFragmentId, sections } from './sections';

interface PolicySectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

const PolicySection: React.FC<PolicySectionProps> = ({ id, title, children }) => (
  <Box
    component="section"
    id={id}
    aria-labelledby={`${id}-heading`}
    sx={{ mt: 4, scrollMarginTop: '96px' }}
  >
    <Typography
      component="h2"
      id={`${id}-heading`}
      variant="h5"
      sx={{ mb: 2, fontWeight: 600, scrollMarginTop: '96px' }}
    >
      {title}
    </Typography>
    {children}
  </Box>
);

const PolicyList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    component="ul"
    sx={{
      pl: 3,
      mb: 2,
      '& li': { mb: 1, lineHeight: 1.7 },
    }}
  >
    {children}
  </Box>
);

const PrivacyPolicy: React.FC = () => {
  const { hash } = useLocation();

  React.useEffect(() => {
    const id = getPrivacyFragmentId(hash);
    if (id) document.getElementById(id)?.scrollIntoView?.();
  }, [hash]);

  return (
    <Container component="main" maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
      <Paper
        elevation={2}
        sx={{
          p: { xs: 3, sm: 5 },
          backgroundColor: 'background.paper',
          borderRadius: 2,
        }}
      >
        <Typography component="h1" variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          DentistDSS Privacy Policy
        </Typography>
        <Typography component="p" color="text.secondary" sx={{ mb: 3 }}>
          DRAFT — not yet in effect
        </Typography>
        <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
          This policy explains how Zhifei Mi and the DentistDSS team (&quot;DentistDSS&quot;,
          &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) collect, use, store, and share
          information when you use the DentistDSS website and progressive web application. It also
          explains the choices available to you. DentistDSS provides dental education, AI-assisted
          guidance, clinic discovery, appointments, and clinic workflow tools.
        </Typography>
        <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
          This policy covers information processed by DentistDSS. A clinic may have its own privacy
          policy and legal obligations for information it collects or accesses through the service.
        </Typography>

        <Box
          component="nav"
          aria-label="Privacy policy sections"
          sx={{ p: 2, mb: 1, bgcolor: 'action.hover', borderRadius: 1 }}
        >
          <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            On this page
          </Typography>
          <Box component="ul" sx={{ columns: { xs: 1, sm: 2 }, pl: 3, m: 0 }}>
            {sections.map(([id, title]) => (
              <Box component="li" key={id} sx={{ mb: 1, breakInside: 'avoid' }}>
                <Link href={`#${id}`} color="primary.main">
                  {title}
                </Link>
              </Box>
            ))}
          </Box>
        </Box>

        <PolicySection id="data-we-collect" title="1. Information we collect">
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            The information we process depends on the features you use and whether you are a
            patient, dentist, receptionist, or clinic administrator.
          </Typography>
          <PolicyList>
            <li>
              <strong>Account and profile details:</strong> name, email address, password
              credentials, account role, email-verification status, last-login information, and,
              where you provide them, date of birth, phone number, address, emergency contact, and
              profile image URL. Dentist profiles may also include specialization, licence number,
              experience, and education.
            </li>
            <li>
              <strong>Clinic and staff details:</strong> clinic name, address, phone number,
              business email, website, staff role, approval status and review notes, schedules,
              availability, working-hours notes, and clinic settings.
            </li>
            <li>
              <strong>Appointments and health-related information:</strong> dentist, clinic and
              service selections, appointment dates and times, reason for visit, symptoms, urgency,
              additional notes, rescheduling and cancellation details, and appointment status.
            </li>
            <li>
              <strong>Clinical records and images:</strong> where clinical-record features are used,
              patient names and contact details, health history, complaints, examination findings,
              diagnoses, treatment and follow-up plans, prescriptions, visit details, clinical or
              AI-assisted notes, and attachment URLs. Dental images such as X-rays are stored with
              thumbnails and metadata such as filename, content type, file size, image type, tooth
              number, description, and tags.
            </li>
            <li>
              <strong>Chatbot and AI content:</strong> the prompts and clinical documentation you
              enter, chatbot responses, conversation history, the selected assistant type, and
              technical or account identifiers needed to provide and secure the conversation.
            </li>
            <li>
              <strong>Messages and notifications:</strong> sender and recipient identifiers,
              subject, message content, delivery or read status, and related timestamps.
            </li>
            <li>
              <strong>Quiz answers:</strong> the dental-hygiene quiz runs in your browser. Your
              answers and score are held temporarily in the page and are not submitted to the
              DentistDSS API by the quiz feature. Retaking or leaving the quiz clears them.
            </li>
            <li>
              <strong>Location and clinic searches:</strong> clinic-search terms and, if you allow
              browser geolocation, latitude, longitude, accuracy, and a timestamp. Your coordinates
              are kept in session storage for clinic discovery and are used to centre Google Maps;
              the map feature does not send them to the DentistDSS API.
            </li>
            <li>
              <strong>Technical and security information:</strong> the API gateway records request
              time, HTTP method and path, resolved client IP address, User-Agent, and response
              status. Its request-logging filter does not record request bodies. Application and
              provider infrastructure may also process browser or device information, error details,
              recipient email addresses, and authentication events. Audit records can include the
              service or user actor, action, target, user and clinic IDs, timestamps, event context,
              and a content hash.
            </li>
          </PolicyList>
        </PolicySection>

        <PolicySection id="google-user-data" title="2. Google user data and OAuth scopes">
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            If you choose Google Sign-In, Google Identity Services gives DentistDSS a Google ID
            token. We send that token over HTTPS to our authentication service, which verifies its
            signature, audience, expiry, and required claims before creating or accessing your
            DentistDSS account. We use only the basic Google Sign-In scopes described below and do
            not request additional Google API scopes:
          </Typography>
          <PolicyList>
            <li>
              <strong><code>openid</code>:</strong> allows OpenID Connect sign-in. We require the
              token&apos;s subject identifier (<code>sub</code>) and store it as your Google provider
              ID so we can authenticate you and associate sign-ins with the correct account.
            </li>
            <li>
              <strong><code>email</code>:</strong> provides your Google email address
              (<code>email</code>) and verification status (<code>email_verified</code>). We require
              a verified email address and store it with your account to identify you, link an
              eligible patient account, and provide account-related communications.
            </li>
            <li>
              <strong><code>profile</code>:</strong> provides basic profile information. We read
              only your given name (<code>given_name</code>) and family name
              (<code>family_name</code>) when present and use them for your DentistDSS first and last
              name. Although Google can include other basic profile fields, we do not read or store
              your full <code>name</code>, profile-picture URL (<code>picture</code>), locale, or
              hosted-domain information in this flow.
            </li>
          </PolicyList>
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            A single-use security <code>nonce</code> is also checked to prevent replay. It is held
            in Redis for up to five minutes and consumed when used; it is not a Google profile field
            or an additional data-access scope.
          </Typography>
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            We do not request access to your Gmail messages, Google Drive files, Google Calendar,
            contacts, or other Google APIs, and we do not request offline access or a Google refresh
            token. Your Google password is not provided to or stored by DentistDSS. Information you
            enter directly into DentistDSS, such as a phone number, address, symptoms, or clinical
            notes, is not represented as coming from Google.
          </Typography>
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            The raw Google ID token is used for sign-in verification and is not stored in browser
            local storage, browser session storage, or the DentistDSS account database. The Google
            provider ID, verified email address, and supplied given and family names are stored as
            part of your account. DentistDSS then issues its own session; Google tokens are not used
            as DentistDSS session tokens.
          </Typography>
        </PolicySection>

        <PolicySection id="how-we-use-data" title="3. How we use information">
          <PolicyList>
            <li>
              <strong>Authentication and accounts:</strong> to create and verify accounts, sign you
              in, restore and end sessions, manage passwords, associate Google Sign-In with your
              account, and display your profile.
            </li>
            <li>
              <strong>Appointments and clinic workflows:</strong> to find clinics and availability,
              book, reschedule, cancel, confirm and complete appointments, manage schedules, and
              allow authorized clinic staff to perform their roles.
            </li>
            <li>
              <strong>Dental-assistant and clinical functionality:</strong> to answer questions,
              provide triage and reception assistance, summarize documentation, maintain
              conversation context, display clinical records, and support dental-care workflows.
            </li>
            <li>
              <strong>Communications and support:</strong> to send verification and service-related
              messages, provide appointment or account notifications, respond to requests, and
              troubleshoot issues.
            </li>
            <li>
              <strong>Security and service operation:</strong> to authenticate requests, enforce
              roles and access controls, prevent fraud and abuse, monitor errors, maintain audit
              records, secure infrastructure, and keep the service available and reliable.
            </li>
          </PolicyList>
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            We do not use Google Sign-In information for targeted advertising, data brokerage, or
            credit decisions. AI-generated information is decision support and is not a substitute
            for diagnosis or treatment by a qualified dental professional.
          </Typography>
        </PolicySection>

        <PolicySection id="storage-retention" title="4. Storage and retention">
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            DentistDSS&apos;s public web application is hosted by Vercel. Account, appointment,
            clinic, session, and clinical metadata are stored in PostgreSQL on our self-hosted
            backend. GenAI conversations and interactions and audit documents use MongoDB. Clinical
            image files and thumbnails use MongoDB GridFS, with related metadata in PostgreSQL.
            Redis holds short-lived Google nonces and account/session-family security state rather
            than raw access tokens. Traffic to the backend passes through Cloudflare and our API
            gateway.
          </Typography>
          <PolicyList>
            <li>
              <strong>Account, clinic, appointment, notification, and clinical records:</strong> the
              current service does not automatically expire or periodically delete these records.
              They are retained while the relevant account or clinic remains active and until
              deleted through an available feature or following a verified deletion request,
              subject to records we need for security, dispute handling, or legal obligations.
            </li>
            <li>
              <strong>Chatbot conversations and AI interaction records:</strong> where AI features
              are enabled, each conversation document retains its latest 50 messages by default,
              removing older messages from that document as new messages arrive. This message limit
              is configurable. A separate AI interaction record stores the full prompt, full or
              partial response, status, identifiers, and usage metadata without the conversation
              message cap. The application does not define an automatic expiry or deletion
              schedule for these interaction records. Closing or clearing the browser view does not
              erase either type of server-side record.
            </li>
            <li>
              <strong>Google and DentistDSS session credentials:</strong> the raw Google ID token is
              not persisted after sign-in verification. A DentistDSS access token is kept in browser
              memory and expires after five minutes; raw access tokens are not stored in the session
              database. Refresh cookies and sessions last up to 30 days unless revoked earlier or
              you sign out. Only SHA-256 hashes of refresh tokens are stored in PostgreSQL, and the
              current service does not automatically delete expired or revoked session rows.
              Revoking Google access does not delete a DentistDSS session or account.
            </li>
            <li>
              <strong>Email verification codes:</strong> codes expire after ten minutes. The
              authentication service stores a peppered SHA-256 hash rather than the raw code. The
              code is sent to the recipient through the configured SMTP email service.
            </li>
            <li>
              <strong>Quiz and other in-memory content:</strong> quiz answers, unsubmitted form
              content, and the current browser-displayed chat state disappear when reset or when
              the relevant page or browser session ends. This does not affect copies already
              submitted to the service.
            </li>
            <li>
              <strong>Browser preferences and location:</strong> theme and notification preferences
              remain in local storage until you clear them or clear site data. A verification-resend
              timer is removed after successful verification or when its cooldown expires or is
              next evaluated. Coordinates in session storage are reused for up to five minutes when
              fresh, are removed when location is cleared or permission is denied, and otherwise
              remain until the browser session ends or site data is cleared; five minutes is not an
              automatic deletion timer.
            </li>
            <li>
              <strong>Downloads:</strong> an AI summary you download as a text file remains on your
              device until you delete it. DentistDSS cannot manage that downloaded copy.
            </li>
            <li>
              <strong>Operational logs, audit entries, and backups:</strong> these may be retained
              separately from information shown in your account and may not be erased immediately
              when an interactive record is deleted. The current production configuration does not
              define a single fixed retention period or automatic deletion schedule for application
              logs, audit entries, or infrastructure backups. Provider-retained logs are also
              subject to the relevant provider&apos;s settings and terms.
            </li>
          </PolicyList>
        </PolicySection>

        <PolicySection id="sharing" title="5. Who we share information with">
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            We disclose information to the following recipients and service providers only for the
            purposes described in this policy. We do not sell personal information, but that
            statement does not replace the specific disclosures below.
          </Typography>
          <PolicyList>
            <li>
              <strong>Vercel (web hosting):</strong> hosts and delivers the public web application
              and processes network and request information when you visit it.
            </li>
            <li>
              <strong>Cloudflare (network and security infrastructure):</strong> routes traffic to
              the backend and processes connection, request, and security information.
            </li>
            <li>
              <strong>Database and backend infrastructure:</strong> self-hosted PostgreSQL, MongoDB,
              GridFS, and Redis store the account, service, clinical, AI, session-security, and audit
              information described above. Redis does not store the raw DentistDSS access tokens.
            </li>
            <li>
              <strong>Google Identity Services (authentication):</strong> processes your Google
              account interaction and provides the ID token used for Google Sign-In. DentistDSS
              does not forward your Google ID token to advertising providers.
            </li>
            <li>
              <strong>Google Maps Platform (clinic discovery):</strong> receives map requests,
              clinic addresses that need geocoding, clinic coordinates, and your coordinates when
              used to centre the map. Directions links may also disclose clinic coordinates or a
              clinic name to Google Maps or Apple Maps when you choose them.
            </li>
            <li>
              <strong>
                Configured self-hosted OpenAI-compatible AI endpoint and OpenAI (conditional AI
                processing; DRAFT):
              </strong>{' '}
              where the GenAI service is enabled and configured, DentistDSS sends the current prompt,
              recent conversation messages, and relevant prompt-template context to the configured
              self-hosted endpoint, which forwards them to OpenAI as an upstream provider to generate
              a response. The default history is up to 10 recent messages and is configurable. See
              the AI processing section below.
            </li>
            <li>
              <strong>SMTP email delivery provider:</strong> processes recipient email addresses,
              sender information, and message content for account verification, appointment, and
              other service-related email. Do not include sensitive health information in ordinary
              email requests to us.
            </li>
            <li>
              <strong>Your clinic and authorized users:</strong> dentists, receptionists, clinic
              administrators, and other authorized clinic personnel can access relevant patient,
              appointment, and clinical information to provide care and perform clinic operations.
              Access depends on their role and relationship to the clinic.
            </li>
            <li>
              <strong>External content and legal recipients:</strong> opening a book, clinic, or
              directions link shares ordinary request information with the destination you choose.
              We may also disclose information to regulators, courts, law enforcement, or advisers
              where legally required or necessary to protect users, investigate abuse, or establish
              or defend legal claims.
            </li>
          </PolicyList>
        </PolicySection>

        <PolicySection id="ai-processing" title="6. AI processing and model training">
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            Where the GenAI service is enabled and configured, the DentistDSS backend sends the
            current prompt, recent conversation messages, and relevant prompt-template context to
            its configured <strong>self-hosted OpenAI-compatible AI endpoint</strong>, which
            forwards them to OpenAI as an upstream provider to generate a response.
            &quot;OpenAI-compatible&quot; describes the interface; the term alone does not identify
            the provider or establish that OpenAI operates the endpoint. By default, up to 10 recent
            messages are included; this history limit is configurable. Built-in prompt context can include a
            display name derived from the local part of your email address, your primary account
            role, whether you are authenticated, and role-specific instructions. Built-in prompts
            do not include your full email address, user ID, clinic ID, or session ID. Custom prompt
            templates may include clinic and session identifiers. User, clinic, and session
            identifiers are nevertheless stored with DentistDSS conversation records. The browser
            sends prompts to our API, not directly to the configured endpoint, and does not contain
            an AI-provider API key.
          </Typography>
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            Prompts and recent messages can contain dental concerns, symptoms, clinical
            observations, treatment notes, or other personal information you choose to enter. If the
            GenAI service is disabled for a deployment, that deployment does not send new prompts to
            an AI provider; disabling the service does not delete previously stored conversations or
            interaction records.
          </Typography>
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            DentistDSS does not use your prompts, responses, Google Sign-In information, clinical
            records, or images to train or fine-tune its own AI models. We do not sell AI content or
            use it for targeted advertising.
          </Typography>
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            Please do not submit another person&apos;s health information or identifying documents
            unless you are authorized to do so. AI responses can be wrong and should be reviewed by
            an appropriate professional.
          </Typography>
        </PolicySection>

        <PolicySection id="your-choices" title="7. Your choices and data rights">
          <PolicyList>
            <li>
              <strong>Access and correct:</strong> signed-in users can view account information and
              use available profile, appointment, message, and clinical-record views. The profile
              page supports changes to first name, last name, date of birth, phone number, and
              address. Contact us to request access to information that is not available through
              your account or to correct information you cannot edit.
            </li>
            <li>
              <strong>Appointments:</strong> available controls let you reschedule or cancel an
              appointment. Cancellation changes the appointment status; it does not erase the
              appointment or its audit history.
            </li>
            <li>
              <strong>Export:</strong> you can download the latest generated AI summary as a text
              file. For an export of other account, appointment, chatbot, or clinical information,
              email a request to the address below. We may need to verify your identity and
              authority, especially for patient or clinic records.
            </li>
            <li>
              <strong>Delete:</strong> the current interface does not provide self-service deletion
              for an entire account, server-side chatbot history, or clinical records. To request
              account or record deletion, email <Link href="mailto:dentistdss@gmail.com">dentistdss@gmail.com</Link>{' '}
              from the relevant account address and identify the information you want deleted. We
              will verify the request and explain any information that must be retained. Browser
              clear, quiz retake, appointment cancellation, and logout are not server-side account
              deletion.
            </li>
            <li>
              <strong>Local data and location:</strong> you can deny location permission, clear
              saved location through available controls, clear downloaded files yourself, or use
              browser settings to remove cookies and site storage. Blocking essential cookies may
              prevent sign-in and session restoration.
            </li>
            <li>
              <strong>Revoke Google access:</strong> visit{' '}
              <Link
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Account third-party access settings
              </Link>{' '}
              and remove DentistDSS. This prevents future authorized Google Sign-In access but does
              not delete your DentistDSS account, end every existing DentistDSS session, or change
              your Google Account credentials. Contact us separately to delete DentistDSS data, and
              use your Google Account settings for Google-side security controls.
            </li>
          </PolicyList>
        </PolicySection>

        <PolicySection id="security" title="8. How we protect information">
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            Our measures include verifying Google ID tokens and single-use nonces, five-minute
            RS256-signed DentistDSS access tokens, BCrypt password hashing, peppered verification-code
            hashes, refresh-token rotation and reuse revocation, and anti-CSRF double-submit checks.
            Browser access and anti-CSRF values are kept in memory, bearer credentials are restricted
            to the configured API origin, and authentication responses use <code>no-store</code>.
            Role-based access controls, backend network policies, and clinical-image validation and
            re-encoding provide additional protection. The service worker bypasses API,
            authentication, OAuth, AI, and authorized requests. Production deployments use HTTPS
            endpoints and security headers to limit content framing and restrict browser
            capabilities.
          </Typography>
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            No online service or storage system can be guaranteed completely secure. Protect your
            account credentials, sign out on shared devices, and contact us if you suspect
            unauthorized access.
          </Typography>
        </PolicySection>

        <PolicySection id="cookies" title="9. Cookies and browser storage">
          <PolicyList>
            <li>
              <strong>Essential session and security cookies:</strong> in production,{' '}
              <code>__Secure-dentistdss-refresh</code> holds the refresh token with{' '}
              <code>HttpOnly</code>, <code>Secure</code>, and <code>SameSite=None</code>, a path of{' '}
              <code>/api/auth</code>, and a maximum age of 30 days. <code>XSRF-TOKEN</code> supports
              anti-CSRF validation with <code>Secure</code> and <code>SameSite=None</code>, a path of{' '}
              <code>/</code>, and a maximum age of 30 days; it is readable by the application so it
              can return the matching header. Signing out expires both cookies. They are not used by
              DentistDSS for advertising.
            </li>
            <li>
              <strong>DentistDSS local storage:</strong> stores your dark-mode preference,
              notification preferences, and a temporary verification-resend timer. It is not used
              to store the current DentistDSS access token or your Google ID token.
            </li>
            <li>
              <strong>DentistDSS session storage:</strong> stores permitted geolocation coordinates
              and related accuracy and timestamp information for clinic discovery.
            </li>
            <li>
              <strong>Static-content caching:</strong> the progressive-web-app service worker caches
              same-origin navigation and static assets. It does not intentionally cache API,
              authentication, OAuth, generative-AI, or authorized responses.
            </li>
            <li>
              <strong>Third-party services:</strong> Google Sign-In and Google Maps may set or read
              their own cookies and use similar technologies under Google&apos;s privacy policy.
              External sites you visit have their own practices.
            </li>
          </PolicyList>
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            DentistDSS does not currently use first-party analytics, advertising, or session-replay
            cookies. You can control cookies and site data through your browser, but essential
            authentication features may not work if you block them.
          </Typography>
        </PolicySection>

        <PolicySection id="international-transfers" title="10. International data transfers">
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            DentistDSS uses providers whose infrastructure may operate in multiple countries,
            including Vercel, Cloudflare, Google, and the email delivery provider. Your information
            may therefore be processed outside the state or country where you live. Self-hosted
            databases and an Australian clinic or default map location do not mean that all data is
            stored exclusively in Australia or any other single region. Provider locations and
            safeguards depend on the service and configuration used.
          </Typography>
        </PolicySection>

        <PolicySection id="policy-changes" title="11. Changes to this policy">
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            We may update this policy when our features, providers, or data practices change. We
            will publish the revised policy at this same URL and update its effective date. If a
            change materially affects how we use Google user data or other personal information, we
            will provide additional notice through the application or by email where appropriate.
            Please review the current policy before continuing to use affected features.
          </Typography>
        </PolicySection>

        <PolicySection id="contact" title="12. Contact us">
          <Typography component="p" sx={{ mb: 2, lineHeight: 1.7 }}>
            For privacy questions or access, correction, export, or deletion requests, contact
            Zhifei Mi / the DentistDSS team at{' '}
            <Link href="mailto:dentistdss@gmail.com">dentistdss@gmail.com</Link>. To help us protect
            your information, use the email address associated with your account where possible and
            do not email passwords, Google tokens, or unnecessary health records.
          </Typography>
        </PolicySection>

      </Paper>
    </Container>
  );
};

export default PrivacyPolicy;
