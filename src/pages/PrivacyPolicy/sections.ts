export const sections = [
  ['data-we-collect', 'Information we collect'],
  ['google-user-data', 'Google user data and OAuth scopes'],
  ['how-we-use-data', 'How we use information'],
  ['storage-retention', 'Storage and retention'],
  ['sharing', 'Who we share information with'],
  ['ai-processing', 'AI processing and model training'],
  ['your-choices', 'Your choices and data rights'],
  ['security', 'How we protect information'],
  ['cookies', 'Cookies and browser storage'],
  ['international-transfers', 'International data transfers'],
  ['policy-changes', 'Changes to this policy'],
  ['contact', 'Contact us'],
] as const;

export const getPrivacyFragmentId = (hash: string): string | undefined => {
  if (!hash.startsWith('#')) return undefined;

  try {
    const id = decodeURIComponent(hash.slice(1));
    return sections.some(([sectionId]) => id === sectionId || id === `${sectionId}-heading`)
      ? id
      : undefined;
  } catch {
    return undefined;
  }
};
