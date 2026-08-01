import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  useTheme,
  useMediaQuery,
  Chip,
  Box,
  Button as MuiButton // Renamed to avoid conflict if you use a Button variable later
} from '@mui/material';
import BookCard from '../../../components/Home/Book/BookCard';
import GradientMesh from '../Welcome/sections/GradientMesh';
import FilterAltIcon from '@mui/icons-material/FilterAlt'; // Import the BookCard component

interface DentalBook {
  id: number;
  title: string;
  authors: string;
  description: string;
  imageUrl: string;
  amazonLink: string;
  topics: string[];
}

// Helper function to generate Amazon search links
const generateAmazonLink = (title: string, authors: string): string => {
  const query = encodeURIComponent(`${title} ${authors}`);
  return `https://www.amazon.com/s?k=${query}`;
};

const dentalBooksData: DentalBook[] = [
  {
    id: 1,
    title: "Dental Secrets",
    authors: "Stephen T. Sonis",
    description: "A comprehensive guide covering a wide range of dental topics in a question-and-answer format.",
    imageUrl: "https://m.media-amazon.com/images/I/71617TD98tL._AC_UY436_FMwebp_QL65_.jpg",
    amazonLink: generateAmazonLink("Dental Secrets", "Stephen T. Sonis"),
    topics: ["General Dentistry", "Reference"]
  },
  {
    id: 2,
    title: "Oxford Handbook of Clinical Dentistry",
    authors: "Laura Mitchell, David A. Mitchell, et al.", // Example authors, update if needed
    description: "A concise and practical guide to clinical dentistry, ideal for students and practitioners.",
    imageUrl: "https://m.media-amazon.com/images/I/713f5wYx+ZL._AC_UY436_FMwebp_QL65_.jpg",
    amazonLink: generateAmazonLink("Oxford Handbook of Clinical Dentistry", "Laura Mitchell"),
    topics: ["General Dentistry", "Clinical Practice", "Reference"]
  },
  {
    id: 3,
    title: "Clinical Practice of the Dental Hygienist",
    authors: "Esther M. Wilkins, Charlotte J. Wyche", // Example authors
    description: "A cornerstone text for dental hygiene students and professionals, covering theory and practice.",
    imageUrl: "https://m.media-amazon.com/images/I/41-15dj1luL._AC_UY436_FMwebp_QL65_.jpg",
    amazonLink: generateAmazonLink("Clinical Practice of the Dental Hygienist", "Esther M. Wilkins"),
    topics: ["Dental Hygiene", "Clinical Practice"]
  },
  {
    id: 4,
    title: "Color Atlas of Dental Hygiene - Periodontology",
    authors: "Herbert F. Wolf, Thomas M. Hassell", // Example authors
    description: "A visually rich atlas focusing on the periodontal aspects of dental hygiene.",
    imageUrl: "https://m.media-amazon.com/images/I/41Ztb8K715L._AC_UY436_FMwebp_QL65_.jpg",
    amazonLink: generateAmazonLink("Color Atlas of Dental Hygiene - Periodontology", "Herbert F. Wolf"),
    topics: ["Dental Hygiene", "Periodontology", "Atlas"]
  },
  {
    id: 5,
    title: "Netter's Head and Neck Anatomy for Dentistry",
    authors: "Neil S. Norton",
    description: "Detailed anatomical illustrations by Frank H. Netter, tailored for dental students and professionals.",
    imageUrl: "https://m.media-amazon.com/images/I/61M1b5BDq9L._AC_UY436_FMwebp_QL65_.jpg",
    amazonLink: generateAmazonLink("Netter's Head and Neck Anatomy for Dentistry", "Neil S. Norton"),
    topics: ["Anatomy", "Reference", "Atlas"]
  },
  {
    id: 6,
    title: "Mosby's Dental Dictionary",
    authors: "Elsevier", // Often publisher or editorial board for dictionaries
    description: "A comprehensive dictionary of dental terms, essential for dental professionals and students.",
    imageUrl: "https://m.media-amazon.com/images/I/51WIjU01iGL._AC_UY436_FMwebp_QL65_.jpg",
    amazonLink: generateAmazonLink("Mosby's Dental Dictionary", "Elsevier"),
    topics: ["Dictionary", "Reference"]
  },
  {
    id: 7,
    title: "Newman and Carranza's Clinical Periodontology", // Combined from list
    authors: "Michael G. Newman, Henry Takei, Perry R. Klokkevold, Fermin A. Carranza",
    description: "A leading textbook on periodontology, covering the full scope of periodontal diseases and treatment.",
    imageUrl: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcSVf6Y4C-y_o3-nHGX5vp2JvkoZZ5fYSw9UkFrY62tj4QbfI71ZRp7AIkTHaXpdyTwZ0CUPpk9oLwSe92dbZ9LMMO2t4ewJSEm5clLUe6oW&usqp=CAc",
    amazonLink: generateAmazonLink("Newman and Carranza's Clinical Periodontology", "Michael G. Newman"),
    topics: ["Periodontology", "Clinical Practice", "Implantology"]
  },
  {
    id: 8,
    title: "Holistic Dental Care: The Complete Guide to Healthy Teeth and Gums",
    authors: "Nadine Artemis",
    description: "Explores a natural and holistic approach to dental health and oral hygiene.",
    imageUrl: "https://m.media-amazon.com/images/I/71W4HEId6DL._AC_UY436_FMwebp_QL65_.jpg",
    amazonLink: generateAmazonLink("Holistic Dental Care", "Nadine Artemis"),
    topics: ["Holistic Dentistry", "Wellness"]
  },
  {
    id: 9,
    title: "The Dental Diet: The Surprising Link between Your Teeth, Real Food, and Life-Changing Natural Health",
    authors: "Dr. Steven Lin",
    description: "Discusses the connection between diet and oral health, advocating for a food-based approach to dental wellness.",
    imageUrl: "https://m.media-amazon.com/images/I/61GhAAvhmML._AC_UY436_FMwebp_QL65_.jpg",
    amazonLink: generateAmazonLink("The Dental Diet", "Dr. Steven Lin"),
    topics: ["Nutrition", "Wellness", "Holistic Dentistry"]
  },
  {
    id: 10,
    title: "The Toxic Tooth: How a Root Canal Could Be Making You Sick",
    authors: "Robert Kulacz, Thomas E. Levy",
    description: "Examines potential health risks associated with root canals and offers alternative perspectives.",
    imageUrl: "https://m.media-amazon.com/images/I/61HORbZYuEL._AC_UY436_FMwebp_QL65_.jpg",
    amazonLink: generateAmazonLink("The Toxic Tooth", "Robert Kulacz"),
    topics: ["Holistic Dentistry", "Controversies"]
  },
  {
    id: 11,
    title: "Woelfel's Dental Anatomy",
    authors: "Rickne C. Scheid, Gabriela Weiss",
    description: "A detailed guide to dental anatomy, its application in practice, and tooth identification.",
    imageUrl: "https://m.media-amazon.com/images/I/71eg4lMr69L._AC_UY436_FMwebp_QL65_.jpg",
    amazonLink: generateAmazonLink("Woelfel's Dental Anatomy", "Rickne C. Scheid"),
    topics: ["Anatomy", "Reference"]
  },
  {
    id: 12,
    title: "Clinical Periodontology and Implant Dentistry",
    authors: "Jan Lindhe, Niklaus P. Lang, Thorkild Karring",
    description: "An authoritative text covering all aspects of periodontology and implant dentistry.",
    imageUrl: "https://m.media-amazon.com/images/I/511Zt29i85L._AC_UY436_FMwebp_QL65_.jpg",
    amazonLink: generateAmazonLink("Clinical Periodontology and Implant Dentistry", "Jan Lindhe"),
    topics: ["Periodontology", "Implantology", "Clinical Practice"]
  },
  {
    id: 13,
    title: "Contemporary Orthodontics",
    authors: "William R. Proffit, Henry W. Fields Jr., Brent E. Larson, David M. Sarver",
    description: "A comprehensive and widely used textbook on orthodontic principles and techniques.",
    imageUrl: "https://m.media-amazon.com/images/I/81Lfb5UR+gL._AC_UY436_FMwebp_QL65_.jpg",
    amazonLink: generateAmazonLink("Contemporary Orthodontics", "William R. Proffit"),
    topics: ["Orthodontics", "Clinical Practice"]
  },
  {
    id: 14,
    title: "Little and Falace's Dental Management of the Medically Compromised Patient",
    authors: "James W. Little, Craig S. Miller, Nelson L. Rhodus",
    description: "Focuses on the dental treatment of patients with systemic diseases and medical conditions.",
    imageUrl: "https://m.media-amazon.com/images/I/81NNN7h6PpL._AC_UY436_FMwebp_QL65_.jpg",
    amazonLink: generateAmazonLink("Little and Falace's Dental Management of the Medically Compromised Patient", "James W. Little"),
    topics: ["Special Needs Dentistry", "Clinical Practice", "General Dentistry"]
  },
  {
    id: 15,
    title: "Cure Tooth Decay: Heal and Prevent Cavities with Nutrition",
    authors: "Ramiel Nagel",
    description: "Advocates for a nutritional approach to preventing and healing tooth decay.",
    imageUrl: "https://m.media-amazon.com/images/I/61eCYy5NDFL._AC_UY436_FMwebp_QL65_.jpg",
    amazonLink: generateAmazonLink("Cure Tooth Decay", "Ramiel Nagel"),
    topics: ["Nutrition", "Holistic Dentistry", "Prevention"]
  },
  {
    id: 16,
    title: "The Mouth-Body Connection: The 28-Day Program to Create Real Health",
    authors: "Gerald P. Curatola, Diane Reverand",
    description: "Explores the link between oral health and overall systemic health, with a 28-day program.",
    imageUrl: "https://m.media-amazon.com/images/I/61I5mxjAZdL._AC_UY436_FMwebp_QL65_.jpg",
    amazonLink: generateAmazonLink("The Mouth-Body Connection", "Gerald P. Curatola"),
    topics: ["Wellness", "Holistic Dentistry", "General Public"]
  },
  {
    id: 17,
    title: "It's All in Your Mouth: The Surprising Link Between the State of Your Teeth and Gums and Your Overall Health",
    authors: "Dr. Frank J. Jerome",
    description: "Highlights the critical role of oral health in overall well-being and disease prevention.",
    imageUrl: "https://m.media-amazon.com/images/I/71WJo5naINL._AC_UY436_FMwebp_QL65_.jpg",
    amazonLink: generateAmazonLink("It's All in Your Mouth", "Dr. Frank J. Jerome"),
    topics: ["Wellness", "General Public", "Prevention"]
  },
  {
    id: 18,
    title: "Contemporary Fixed Prosthodontics",
    authors: "Stephen F. Rosenstiel, Martin F. Land, Junhei Fujimoto",
    description: "A comprehensive text on fixed prosthodontics, covering diagnosis, treatment planning, and procedures.",
    imageUrl: "https://m.media-amazon.com/images/I/61erCbJWUYL._AC_UY436_FMwebp_QL65_.jpg",
    amazonLink: generateAmazonLink("Contemporary Fixed Prosthodontics", "Stephen F. Rosenstiel"),
    topics: ["Prosthodontics", "Clinical Practice"]
  },
  {
    id: 19,
    title: "Misch's Contemporary Implant Dentistry",
    authors: "Carl E. Misch, Randolph R. Resnik",
    description: "A leading resource on implant dentistry, from basic science to advanced clinical techniques.",
    imageUrl: "https://m.media-amazon.com/images/I/61VwoIOWUtL._AC_UY436_FMwebp_QL65_.jpg",
    amazonLink: generateAmazonLink("Misch's Contemporary Implant Dentistry", "Carl E. Misch"),
    topics: ["Implantology", "Clinical Practice"]
  },
  {
    id: 20,
    title: "Handbook of Local Anesthesia",
    authors: "Stanley F. Malamed",
    description: "The definitive guide to local anesthesia in dentistry, covering pharmacology, techniques, and complications.",
    imageUrl: "https://m.media-amazon.com/images/I/31q2KYF10TL._AC_UY436_FMwebp_QL65_.jpg",
    amazonLink: generateAmazonLink("Handbook of Local Anesthesia", "Stanley F. Malamed"),
    topics: ["Anesthesia", "Clinical Practice", "Reference"]
  }
  // Additional books truncated for brevity - the full list would continue here
];

// Get unique topics from books data for chip generation
const allTopics = [...new Set(dentalBooksData.flatMap(book => book.topics))].sort();

/**
 * BookPage - Dental books catalog page
 * 
 * Features:
 * - Comprehensive dental book collection
 * - Topic-based filtering with chips
 * - Amazon integration for book purchases
 * - Responsive grid layout
 * - Dark mode support
 */
const BookPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<DentalBook[]>(dentalBooksData);

  useEffect(() => {
    if (selectedTopics.length === 0) {
      setFilteredBooks(dentalBooksData);
    } else {
      setFilteredBooks(
        dentalBooksData.filter(book =>
          selectedTopics.some(topic => book.topics.includes(topic))
        )
      );
    }
  }, [selectedTopics]);

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics(prevSelectedTopics =>
      prevSelectedTopics.includes(topic)
        ? prevSelectedTopics.filter(t => t !== topic)
        : [...prevSelectedTopics, topic]
    );
  };

  const clearFilters = () => {
    setSelectedTopics([]);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero — same GradientMesh idiom as the Learn page: eyebrow, h1,
          subcopy, and topic chips that are violet when active and
          hairline-outlined when not. */}
      <GradientMesh>
        <Box
          sx={{
            textAlign: 'center',
            mb: 4,
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'primary.main',
              fontSize: '0.75rem',
              mb: 1.5,
            }}
          >
            Reading list
          </Typography>
          <Typography
            variant={isMobile ? "h4" : "h3"}
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              mb: 2
            }}
          >
            Dental Reading List
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mb: 3,
              color: 'text.secondary',
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.7,
            }}
          >
            Explore our curated list of dental books. Click on any book to find it on Amazon.
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <FilterAltIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="subtitle1" color="text.primary">
              Filter by topic:
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
            {allTopics.map((topic) => {
              const active = selectedTopics.includes(topic);
              return (
                <Chip
                  key={topic}
                  label={topic}
                  onClick={() => handleTopicToggle(topic)}
                  color={active ? 'primary' : 'default'}
                  variant={active ? 'filled' : 'outlined'}
                  sx={{
                    fontWeight: active ? 600 : 500,
                    ...(active
                      ? {}
                      : {
                          color: 'text.primary',
                          borderColor: 'divider',
                          '&:hover': { bgcolor: 'action.hover' },
                        }),
                  }}
                />
              );
            })}
          </Box>

          {selectedTopics.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <MuiButton
                variant="text"
                onClick={clearFilters}
                size="small"
                color="primary"
                sx={{ textTransform: 'none' }}
              >
                Clear All Filters
              </MuiButton>
            </Box>
          )}
        </Box>
      </GradientMesh>

      {filteredBooks.length > 0 ? (
        <Grid container spacing={isMobile ? 2 : 3}>
          {filteredBooks.map((book) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={book.id}>
              <BookCard book={book} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography
          variant="body1"
          align="center"
          color="text.secondary"
          sx={{ mt: 4 }}
        >
          No books found matching your selected topic(s). Try clearing filters or selecting different topics.
        </Typography>
      )}
    </Container>
  );
};

export default BookPage;
