/**
 * Copy for the clinic-facing pages (/for-clinics and its feature pages). It
 * describes only features that exist in the app today; see the dashboard
 * routes in src/utils/dashboard/roleConfig.tsx. No pricing or customer claims
 * until they are real and approved.
 */

export interface FeatureSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface FeatureFaq {
  question: string;
  answer: string;
}

export interface ClinicFeature {
  slug: 'online-booking' | 'ai-receptionist' | 'patient-records' | 'staff-roles';
  /** Short name for links and cards. */
  name: string;
  /** One line for the hub's feature cards. */
  summary: string;
  /** <title> text before " | DentistDSS". */
  seoTitle: string;
  description: string;
  heading: string;
  intro: string;
  sections: FeatureSection[];
  faqs: FeatureFaq[];
}

export const FOR_CLINICS_PATH = '/for-clinics';
export const featurePath = (feature: Pick<ClinicFeature, 'slug'>) =>
  `${FOR_CLINICS_PATH}/${feature.slug}`;

export const FOR_CLINICS_HUB = {
  seoTitle: 'Dental Practice Software with Online Booking',
  description:
    'Online booking, dentist schedules, patient records and an AI receptionist for dental clinics, shared by your whole team. Register your clinic today.',
  heading: 'Dental practice software for your whole front desk',
  intro:
    'DentistDSS brings online booking, dentist schedules, patient records and an AI receptionist into one web app. Patients find your clinic and book open times themselves, and your dentists, receptionists and admins each see what their role needs.',
  steps: [
    {
      title: 'Register your clinic',
      text: 'A clinic admin creates your clinic account. The DentistDSS team reviews every new clinic before it goes live.',
    },
    {
      title: 'Bring in your team',
      text: 'Dentists and receptionists sign up, choose your clinic and verify their email. You approve each one.',
    },
    {
      title: 'Set your hours',
      text: 'Add opening hours, holidays and closures. Each dentist adds the times they can see patients.',
    },
    {
      title: 'Take bookings',
      text: 'Patients search for your clinic, pick a dentist and an open time, and tell you why they are coming.',
    },
  ],
  browser:
    'DentistDSS runs in the browser on computers, tablets and phones, and can be installed like an app. There is nothing to set up on your clinic computers.',
};

export const CLINIC_FEATURES: readonly ClinicFeature[] = [
  {
    slug: 'online-booking',
    name: 'Online booking',
    summary: 'Patients book the open times your dentists set, and your team confirms them.',
    seoTitle: 'Online Booking Software for Dental Clinics',
    description:
      'Let patients book open appointment times with your dentists online. Set opening hours, holidays and availability, then confirm requests in one place.',
    heading: 'Online booking for dental clinics',
    intro:
      "Patients search for your clinic, pick a dentist and an open time, and tell you why they're coming. Your team sees the request straight away and confirms it, without a phone call.",
    sections: [
      {
        heading: 'Patients book only the times you open',
        paragraphs: [
          'Each dentist adds the slots they can see patients, and can block a slot they need back, with a reason. Patients only see times that are genuinely free.',
        ],
        bullets: [
          'Opening hours set day by day for the whole clinic',
          'Holidays and closures: patients cannot book on days you are shut',
          'Availability per dentist, so patients choose who they see',
        ],
      },
      {
        heading: 'Know why each patient is coming',
        paragraphs: [
          'The booking form asks for the type of service, the reason for the visit and any symptoms, along with contact details and an optional emergency contact. Your dentist has it all before the patient sits down.',
        ],
      },
      {
        heading: 'Every appointment in one list',
        paragraphs: [
          'Receptionists and dentists see appointments in a list and on a calendar, and can search by patient or service. New bookings arrive as requests that your team confirms, reschedules or cancels, with a recorded reason for each cancellation. After the visit, mark the appointment complete or as a no-show.',
        ],
      },
      {
        heading: 'Found by patients searching nearby',
        paragraphs: [
          'Your clinic appears in DentistDSS clinic search, where patients compare clinics on a map by suburb, clinic name or treatment before they book.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do patients need an account to book?',
        answer:
          'Yes. Patients sign up with their email or Google account before booking, so your clinic has their contact details and they can see and manage their appointments.',
      },
      {
        question: 'Is a booking confirmed straight away?',
        answer:
          'New bookings arrive as requests. A receptionist or dentist confirms each one, and can reschedule it if the time no longer works.',
      },
      {
        question: 'Can we stop bookings on public holidays?',
        answer: 'Yes. Add holidays and closures, and patients cannot book on those days.',
      },
    ],
  },
  {
    slug: 'ai-receptionist',
    name: 'AI receptionist',
    summary: 'Dentabot answers routine patient questions any time, so your front desk can focus.',
    seoTitle: 'AI Receptionist for Dental Clinics',
    description:
      "Dentabot answers patients' questions about appointments, opening hours and services any time, and helps them judge when a symptom needs a visit.",
    heading: 'An AI receptionist for your dental clinic',
    intro:
      'Dentabot is the DentistDSS assistant. It answers routine patient questions day or night, so your team spends less time on the phone and more time with the patients in front of them.',
    sections: [
      {
        heading: 'Answers routine questions any time',
        paragraphs: [
          'Patients ask about appointments, opening hours and services in their own words, from the DentistDSS website or their patient dashboard.',
        ],
      },
      {
        heading: 'Helps patients decide when to book',
        paragraphs: [
          'In symptom check, patients describe what they feel. Dentabot explains the likely causes, suggests safe self-care and tells them when it is time to see a dentist.',
          'Dentabot gives general information, not a diagnosis. For severe pain, swelling or bleeding that will not stop, it tells patients to contact a clinic or emergency service straight away.',
        ],
      },
      {
        heading: 'AI tools for your dentists',
        paragraphs: ['Dentists get two more assistants in their dashboard:'],
        bullets: [
          'Note summaries: paste appointment or clinical notes and get a structured summary to check before using it',
          'Clinical assistant: ask about symptoms, treatment options and clinical guidelines, and weigh the answers against your own clinical judgement',
        ],
      },
      {
        heading: 'Built with privacy in mind',
        paragraphs: [
          "AI requests are sent from DentistDSS servers, never straight from a patient's browser, and no AI provider key is ever exposed to the browser. Our privacy policy explains what is shared and why.",
        ],
      },
    ],
    faqs: [
      {
        question: 'Does Dentabot replace our receptionist?',
        answer:
          'No. It takes the routine questions so your team can focus on patients in the clinic. Your staff still confirm every booking.',
      },
      {
        question: 'Can Dentabot diagnose patients?',
        answer:
          'No. It gives general information and suggests when to see a dentist. It does not replace an examination.',
      },
      {
        question: 'Where do patient questions go?',
        answer:
          "Questions are sent from DentistDSS servers to the AI service, not from the patient's browser. Our privacy policy explains what is shared and why.",
      },
    ],
  },
  {
    slug: 'patient-records',
    name: 'Patient records',
    summary: 'Visit history and clinical notes for every patient, shared with the right people.',
    seoTitle: 'Dental Patient Records Software',
    description:
      'Keep visit history and clinical notes for every patient in one place, shared with the dentists who need them, and let patients see their own records.',
    heading: 'Patient records that follow every visit',
    intro:
      "DentistDSS keeps each patient's visit history and notes together, so the dentist seeing them today knows what happened last time.",
    sections: [
      {
        heading: 'Visit history and notes in one place',
        paragraphs: [
          'Dentists see the patients they have treated, with the visit history and notes from each appointment, instead of searching through separate systems.',
        ],
      },
      {
        heading: 'Patients see their own records',
        paragraphs: [
          'Patients can read the treatment history and notes from their clinic visits in their own dashboard, which helps them follow the care plan you agreed.',
        ],
      },
      {
        heading: 'Summaries in plain language',
        paragraphs: [
          'Note summaries turn clinical notes into a structured summary. The dentist reads it through before it is used, so the clinical record stays in their hands.',
        ],
      },
      {
        heading: 'Access that matches each role',
        paragraphs: ['Every account sees only what its role needs:'],
        bullets: [
          'Dentists: records for the patients they have seen',
          'Receptionists: the patient list they need to manage bookings',
          'Patients: their own records and appointments',
        ],
      },
    ],
    faqs: [
      {
        question: "Who can see a patient's records?",
        answer:
          "The dentists who treat the patient, and the patient. Staff accounts can only use your clinic's dashboard after your clinic admin approves them.",
      },
      {
        question: 'How is the data protected?',
        answer:
          'Records stay on DentistDSS servers and are shown only to signed-in accounts with the right role. Our privacy policy explains how data is stored and protected.',
      },
    ],
  },
  {
    slug: 'staff-roles',
    name: 'Staff roles and approvals',
    summary: 'A dashboard for each role, and nobody joins your clinic without your approval.',
    seoTitle: 'Staff Roles & Approvals for Dental Clinics',
    description:
      'Give dentists, receptionists and clinic admins their own dashboards. Staff join your clinic, you approve them, and each role sees only what it needs.',
    heading: 'Roles and approvals for your clinic team',
    intro:
      'Everyone at your clinic signs in with their own DentistDSS account. Each role gets a dashboard built for its job, and nobody joins your clinic until an admin approves them.',
    sections: [
      {
        heading: 'A dashboard for each role',
        paragraphs: ['Navigation and pages change with the role of the person signed in:'],
        bullets: [
          'Dentists: appointments, schedule and availability, patient records, note summaries, the clinical assistant and messages',
          'Receptionists: appointments, the patient list, communications and messages',
          'Clinic admins: staff, approvals, opening hours, holidays and clinic settings',
          'Patients: their appointments, dental records, Dentabot and messages',
        ],
      },
      {
        heading: 'Approve who joins your clinic',
        paragraphs: [
          'Dentists and receptionists sign up, choose your clinic and verify their email. Their account then waits for your approval, so only the people you accept see your clinic\'s schedule and patients. New clinics are reviewed by the DentistDSS team.',
        ],
      },
      {
        heading: 'Messages in one inbox',
        paragraphs: [
          'Every role has a messages inbox inside DentistDSS, so conversations stay with the rest of the clinic work instead of in personal email.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How do staff join our clinic?',
        answer:
          'They sign up as clinic staff, choose your clinic and verify their email. You approve their account from the Approvals page.',
      },
      {
        question: 'Can one clinic have several dentists?',
        answer:
          'Yes. Each dentist sets their own availability, and patients choose a dentist when they book.',
      },
    ],
  },
];

const bySlug = new Map(CLINIC_FEATURES.map((feature) => [feature.slug, feature]));

export const findClinicFeature = (slug: string | undefined): ClinicFeature | undefined =>
  slug ? bySlug.get(slug as ClinicFeature['slug']) : undefined;
