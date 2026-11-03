/**
 * Learn articles: metadata only. Bodies live next to this file as <slug>.md
 * and are loaded by the article page (src/pages/Home/LearnArticle), so this
 * module stays small enough for the SEO registry and the build config.
 *
 * Expanded drafts waiting for a dentist's review live in ./drafts and are
 * never routed, prerendered or listed in the sitemap. See
 * docs/seo/article-review.md for how a reviewed draft gets published.
 */

export interface ArticleReviewer {
  name: string;
  /** For example "BDS, General dentist, AHPRA DEN0001234567". */
  credentials: string;
  url?: string;
}

export interface ArticleReference {
  title: string;
  publisher: string;
  url: string;
}

export interface Article {
  slug: string;
  /** On-page heading and card title. */
  title: string;
  /** <title> text before " | DentistDSS"; keep the whole title under 60 characters. */
  seoTitle: string;
  /** Meta description and card summary, 70–160 characters. */
  description: string;
  tags: string[];
  /** 1600px-wide image under public/images/learn, also used for social cards. */
  image: { src: string; card: string; alt: string; width: number; height: number };
  /** ISO dates. Change dateModified only when the content really changes. */
  datePublished: string;
  dateModified: string;
  reviewer?: ArticleReviewer;
  references: ArticleReference[];
}

export const ARTICLE_TAGS = ['Prevention', 'Treatment', 'Oral Care', 'Dental Procedures', 'Health Tips'];

const image = (slug: string, alt: string, width = 1600, height = 1067) => ({
  src: `/images/learn/${slug}.webp`,
  card: `/images/learn/${slug}-card.webp`,
  alt,
  width,
  height,
});

// First published with the original Learn page (commit bee7121).
const FIRST_PUBLISHED = '2025-06-04';

// Revised after the editorial review in docs/seo/article-review-2026-11-03.md
// (an evidence-based content review, not a dentist's clinical sign-off).
const REVISED = '2026-11-03';

export const ARTICLES: readonly Article[] = [
  {
    slug: 'gum-disease',
    title: 'Understanding Gum Disease: Early Signs and Prevention',
    seoTitle: 'Gum Disease: Early Signs, Causes & Prevention',
    description:
      'Red, swollen or bleeding gums can be the first sign of gum disease. Learn how gingivitis becomes periodontitis and how to prevent it.',
    tags: ['Prevention', 'Oral Care', 'Health Tips'],
    image: image('gum-disease', "A dentist in gloves examining a patient's gums during a check-up"),
    datePublished: FIRST_PUBLISHED,
    dateModified: REVISED,
    references: [
      { title: 'Gum diseases', publisher: 'Australian Dental Association', url: 'https://teeth.org.au/gum-diseases' },
      { title: 'Gum disease treatment', publisher: 'Australian Dental Association', url: 'https://teeth.org.au/gum-disease-treatment' },
      { title: 'Gum disease', publisher: 'Queensland Government', url: 'https://www.qld.gov.au/health/condition/mouth-and-dental-health/oral-health-conditions/gum-disease' },
      { title: 'Gum disease', publisher: 'NHS', url: 'https://www.nhs.uk/conditions/gum-disease/' },
    ],
  },
  {
    slug: 'cavities',
    title: 'The Truth About Cavities and How to Avoid Them',
    seoTitle: 'Tooth Cavities: Causes, Signs & Prevention',
    description:
      'How sugar, bacteria and acid cause tooth decay, the signs of a cavity, and how fillings, crowns and fluoride treat and prevent it.',
    tags: ['Prevention', 'Treatment', 'Oral Care'],
    image: image('cavities', "A dentist using a mirror and probe to check a patient's teeth"),
    datePublished: FIRST_PUBLISHED,
    dateModified: REVISED,
    references: [
      { title: 'Tooth decay', publisher: 'Australian Dental Association', url: 'https://teeth.org.au/tooth-decay' },
      { title: 'The tooth decay process', publisher: 'National Institute of Dental and Craniofacial Research (US)', url: 'https://www.nidcr.nih.gov/health-info/tooth-decay/more-info/tooth-decay-process' },
      { title: 'Tooth decay', publisher: 'National Institute of Dental and Craniofacial Research (US)', url: 'https://www.nidcr.nih.gov/health-info/tooth-decay' },
    ],
  },
  {
    slug: 'wisdom-teeth',
    title: 'Wisdom Teeth: What You Should Know',
    seoTitle: 'Wisdom Teeth: Problems, Removal & Recovery',
    description:
      'When wisdom teeth become impacted or infected, why dentists may recommend removal, and how to recover and avoid dry socket.',
    tags: ['Treatment', 'Dental Procedures', 'Health Tips'],
    image: image('wisdom-teeth', 'Extracted teeth, including molars, on a wooden surface'),
    datePublished: FIRST_PUBLISHED,
    dateModified: REVISED,
    references: [
      { title: 'Wisdom teeth', publisher: 'Australian Dental Association', url: 'https://teeth.org.au/wisdom-teeth' },
      { title: 'Wisdom tooth removal', publisher: 'NHS', url: 'https://www.nhs.uk/tests-and-treatments/wisdom-tooth-removal/' },
    ],
  },
  {
    slug: 'tooth-sensitivity',
    title: 'Tooth Sensitivity: Causes and Relief Tips',
    seoTitle: 'Sensitive Teeth: Causes & Relief Tips',
    description:
      'Why teeth hurt with hot or cold food, from worn enamel and receding gums to decay or a cracked tooth, what helps, and when to see a dentist.',
    tags: ['Treatment', 'Oral Care', 'Health Tips'],
    image: image('tooth-sensitivity', 'A smiling woman touching her cheek beside her teeth', 1600, 2398),
    datePublished: FIRST_PUBLISHED,
    dateModified: REVISED,
    references: [
      { title: 'Sensitive teeth', publisher: 'Australian Dental Association', url: 'https://teeth.org.au/sensitive-teeth' },
      { title: 'Sensitive teeth', publisher: 'American Dental Association (MouthHealthy)', url: 'https://www.mouthhealthy.org/all-topics-a-z/sensitive-teeth/' },
      { title: 'Toothache and gum swelling', publisher: 'healthdirect Australia', url: 'https://www.healthdirect.gov.au/symptoms/aches-and-pains/toothache-and-gum-swelling' },
    ],
  },
  {
    slug: 'bad-breath',
    title: 'Bad Breath: The Dental Connection',
    seoTitle: 'Bad Breath (Halitosis): Causes & Fixes',
    description:
      'Most bad breath starts in the mouth. Learn the common causes, from bacteria and dry mouth to gum disease, what helps, and when to see a dentist.',
    tags: ['Prevention', 'Oral Care', 'Health Tips'],
    image: image('bad-breath', 'Four people covering their faces with a paper bag, face shields and a mask'),
    datePublished: FIRST_PUBLISHED,
    dateModified: REVISED,
    references: [
      { title: 'Halitosis', publisher: 'healthdirect Australia', url: 'https://www.healthdirect.gov.au/conditions/mouth-and-tooth-diseases/halitosis' },
      { title: 'Bad breath', publisher: 'Queensland Government', url: 'https://www.qld.gov.au/health/condition/mouth-and-dental-health/oral-health-conditions/bad-breath' },
      { title: 'Bad breath', publisher: 'NHS', url: 'https://www.nhs.uk/symptoms/bad-breath/' },
    ],
  },
  {
    slug: 'dental-implants',
    title: 'Dental Implants: Are They Right for You?',
    seoTitle: 'Dental Implants: Are They Right for You?',
    description:
      'How dental implants replace missing teeth, the alternatives and risks to weigh up, who is a good candidate, and how to look after them.',
    tags: ['Treatment', 'Dental Procedures'],
    image: image('dental-implants', 'A clear model of a jaw showing implant posts under replacement teeth', 1600, 2397),
    datePublished: FIRST_PUBLISHED,
    dateModified: REVISED,
    references: [
      { title: 'Dental implant', publisher: 'healthdirect Australia', url: 'https://www.healthdirect.gov.au/procedures/dental-procedures-and-appliances/dental-implant' },
      { title: 'Dental implants', publisher: 'Guy\'s and St Thomas\' NHS Foundation Trust', url: 'https://www.guysandstthomas.nhs.uk/health-information/dental-implants' },
      { title: 'Delivering better oral health, chapter 5: periodontal diseases', publisher: 'UK Government', url: 'https://www.gov.uk/government/publications/delivering-better-oral-health-an-evidence-based-toolkit-for-prevention/chapter-5-periodontal-diseases' },
    ],
  },
  {
    slug: 'oral-cancer',
    title: 'Oral Cancer: Early Detection Saves Lives',
    seoTitle: 'Oral Cancer: Early Signs & Risk Factors',
    description:
      'Mouth sores, lumps and red or white patches that do not heal can be early signs of oral cancer. Know the risks and when to get checked.',
    tags: ['Prevention', 'Treatment', 'Health Tips'],
    image: image('oral-cancer', 'A smiling person holding a capsule between their front teeth', 1600, 2400),
    datePublished: FIRST_PUBLISHED,
    dateModified: REVISED,
    references: [
      { title: 'Mouth cancer', publisher: 'Better Health Channel, Victorian Government', url: 'https://www.betterhealth.vic.gov.au/health/conditionsandtreatments/mouth-cancer' },
      { title: 'Mouth cancer', publisher: 'healthdirect Australia', url: 'https://www.healthdirect.gov.au/conditions/cancer/mouth-cancer' },
      { title: 'Referral', publisher: 'Oral Cancer Learning Hub', url: 'https://www.oralcancerhub.org.au/referral' },
      { title: 'Head and neck cancers', publisher: 'National Cancer Institute (US)', url: 'https://www.cancer.gov/types/head-and-neck/head-neck-fact-sheet' },
    ],
  },
];

const bySlug = new Map(ARTICLES.map((article) => [article.slug, article]));

export const findArticle = (slug: string | undefined): Article | undefined =>
  slug ? bySlug.get(slug) : undefined;

export const articlePath = (article: Pick<Article, 'slug'>): string => `/learn/${article.slug}`;

/** Other articles, most shared tags first, then in list order. */
export function relatedArticles(article: Article, count = 3): Article[] {
  return ARTICLES.filter(({ slug }) => slug !== article.slug)
    .map((other, index) => ({
      other,
      index,
      shared: other.tags.filter((tag) => article.tags.includes(tag)).length,
    }))
    .sort((a, b) => b.shared - a.shared || a.index - b.index)
    .slice(0, count)
    .map(({ other }) => other);
}
