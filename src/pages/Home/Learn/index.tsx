import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  Fade,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  AppBar,
  Toolbar,
  Slide,
  DialogTitle,
  DialogActions
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import GradientMesh from '../Welcome/sections/GradientMesh';

import img11 from '../../../assets/learn/11-card.webp';
import img22 from '../../../assets/learn/22-card.webp';
import img33 from '../../../assets/learn/33-card.webp';
import img44 from '../../../assets/learn/44-card.webp';
import img55 from '../../../assets/learn/55-card.webp';
import img66 from '../../../assets/learn/66-card.webp';
import img77 from '../../../assets/learn/77-card.webp';
import full11 from '../../../assets/learn/11-full.webp';
import full22 from '../../../assets/learn/22-full.webp';
import full33 from '../../../assets/learn/33-full.webp';
import full44 from '../../../assets/learn/44-full.webp';
import full55 from '../../../assets/learn/55-full.webp';
import full66 from '../../../assets/learn/66-full.webp';
import full77 from '../../../assets/learn/77-full.webp';

interface Article {
  title: string;
  content: string;
  /** Card grid thumbnail (~800px WebP, lazy-loaded). */
  img: string;
  /** Reading-dialog image (~1600px WebP), fetched only when an article opens. */
  fullImg: string;
  tags: string[];
}

const Transition = React.forwardRef<unknown, TransitionProps & { children: React.ReactElement }>(
  function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  }
);

const articles: Article[] = [
  {
    title: 'Understanding Gum Disease: Early Signs and Prevention',
    content: `Gum disease, or periodontal disease, is one of the most common oral health problems that often begins unnoticed. It starts when plaque, a sticky film of bacteria, builds up on teeth and hardens. This can cause inflammation of the gums known as gingivitis. If not treated, it can advance to periodontitis, a serious infection that damages the soft tissue and destroys the bone that supports your teeth.

Early symptoms include red, swollen, and bleeding gums. Fortunately, gum disease is preventable with good oral hygiene: brushing your teeth twice a day, flossing daily, and regular dental checkups. Risk factors include smoking, diabetes, hormonal changes, and certain illnesses.

If left untreated, gum disease can lead to tooth loss and is even linked to other health problems like heart disease. Treatments vary depending on the severity, from deep cleaning (scaling and root planing) to surgical procedures in advanced stages. Maintaining a consistent dental routine is the best defense against gum disease.`,
    img: img11,
    fullImg: full11,
    tags: ['Prevention', 'Oral Care', 'Health Tips']
  },
  {
    title: 'The Truth About Cavities and How to Avoid Them',
    content: `Cavities, also called dental caries, are damaged areas in the hard surface of your teeth that develop into tiny holes or openings. They are caused by bacteria in the mouth that feed on sugars and starches from food and produce acid that erodes tooth enamel.

Frequent snacking, sugary drinks, and poor oral hygiene significantly increase your risk of cavities. Signs include toothache, sensitivity, visible holes, and staining. Prevention involves limiting sugar intake, using fluoride toothpaste, and regular dental cleanings.

Treatment depends on the severity: minor cavities are treated with fillings, while advanced decay may require crowns or root canals. In some cases, extraction may be necessary. Early detection is crucial, making routine dental visits essential.`,
    img: img22,
    fullImg: full22,
    tags: ['Prevention', 'Treatment', 'Oral Care']
  },
  {
    title: 'Wisdom Teeth: What You Should Know',
    content: `Wisdom teeth are the last set of molars that usually emerge in your late teens or early twenties. For many, they grow in without issue. However, for others, they can cause problems such as impaction, infection, or misalignment.

Impacted wisdom teeth are trapped beneath the gum or in the jaw and can cause pain, swelling, and jaw stiffness. They may also damage adjacent teeth or lead to infections. Dentists often recommend removing them as a preventive measure.

Post-extraction recovery involves managing swelling, pain, and preventing dry socket. It's crucial to follow post-op care instructions closely. Not all wisdom teeth require removal — a dentist can monitor their development through X-rays.`,
    img: img33,
    fullImg: full33,
    tags: ['Treatment', 'Dental Procedures', 'Health Tips']
  },
  {
    title: 'Tooth Sensitivity: Causes and Relief Tips',
    content: `Tooth sensitivity, or dentin hypersensitivity, occurs when the enamel that protects your teeth gets thinner, or when gum recession exposes the underlying dentin. This causes discomfort when consuming hot, cold, sweet, or acidic foods and drinks.

Common causes include aggressive brushing, gum disease, tooth grinding, and acidic diets. Sensitive teeth can also result from recent dental procedures like whitening.

Using desensitizing toothpaste, avoiding acidic foods, and practicing gentle brushing can help. For severe cases, treatments like fluoride gel or dental bonding may be needed. Regular dental checkups ensure early intervention and long-term comfort.`,
    img: img44,
    fullImg: full44,
    tags: ['Treatment', 'Oral Care', 'Health Tips']
  },
  {
    title: 'Bad Breath: The Dental Connection',
    content: `Bad breath, medically known as halitosis, is often caused by poor dental hygiene. When food particles remain in the mouth, bacteria break them down, producing sulfur compounds responsible for unpleasant odors.

Other causes include dry mouth, gum disease, cavities, and infections. Smoking and certain foods (like garlic or onions) can also contribute.

To combat bad breath, maintain good oral hygiene by brushing your teeth and tongue twice a day, flossing, and using mouthwash. Stay hydrated and visit your dentist regularly to identify any underlying dental issues. Persistent bad breath should not be ignored — it may indicate more serious health problems.`,
    img: img55,
    fullImg: full55,
    tags: ['Prevention', 'Oral Care', 'Health Tips']
  },
  {
    title: 'Dental Implants: Are They Right for You?',
    content: `Dental implants are artificial tooth roots made of titanium that provide a permanent base for fixed or removable replacement teeth. They're an excellent option for people who've lost teeth due to injury, decay, or disease.

Unlike dentures, implants are durable, stable, and mimic natural teeth. The process involves surgical placement of the implant, healing, and attachment of the crown. Success rates are high when performed by qualified dentists and maintained properly.

Patients must have healthy gums and sufficient bone to support the implant. Smokers and individuals with chronic illnesses may need additional evaluation. Dental implants require the same care as natural teeth — daily brushing, flossing, and regular dental visits.`,
    img: img66,
    fullImg: full66,
    tags: ['Treatment', 'Dental Procedures']
  },
  {
    title: 'Oral Cancer: Early Detection Saves Lives',
    content: `Oral cancer can affect the lips, tongue, cheeks, floor of the mouth, and throat. It's often linked to tobacco use, alcohol, human papillomavirus (HPV), and prolonged sun exposure.

Early symptoms include mouth sores, lumps, or red or white patches that persist. Difficulty chewing, swallowing, or speaking may also indicate cancer. Regular dental checkups often include oral cancer screenings.

Early diagnosis dramatically improves survival rates. Prevention includes avoiding tobacco, limiting alcohol, practicing good oral hygiene, and getting HPV vaccinations. Any unusual changes in your mouth should be promptly examined by a dental professional.`,
    img: img77,
    fullImg: full77,
    tags: ['Prevention', 'Treatment', 'Health Tips']
  }
];

const allTags = ['Prevention', 'Treatment', 'Oral Care', 'Dental Procedures', 'Health Tips'];

/**
 * Learn - Educational articles about dental health
 * 
 * Features:
 * - Comprehensive collection of dental health articles
 * - Topic-based filtering system
 * - Full-screen article reading experience
 * - Animated article loading
 * - Responsive design with dark mode support
 */
const Learn: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [visibleArticles, setVisibleArticles] = useState<number[]>([]);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const filteredArticles = activeFilters.length > 0
    ? articles.filter(article =>
      article.tags.some(tag => activeFilters.includes(tag))
    )
    : articles;

  useEffect(() => {
    // Animate articles appearing one by one
    const timer = setTimeout(() => {
      articles.forEach((_, index) => {
        setTimeout(() => {
          setVisibleArticles(prev => [...prev, index]);
        }, index * 200);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleReadMore = (article: Article) => {
    setSelectedArticle(article);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleFilterToggle = (tag: string) => {
    setActiveFilters(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section — GradientMesh panel in the landing's idiom; every
          text and chip stays on theme colors (no contrastText-on-band
          tricks, which were unreadable in both themes). */}
      <GradientMesh>
        <Box
          sx={{
            textAlign: 'center',
            mb: 6,
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
            Oral health library
          </Typography>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              mb: 2
            }}
          >
            Learn About Oral Health
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mb: 3,
              color: 'text.secondary',
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.7,
            }}
          >
            Discover essential information about dental health, common conditions, and how to maintain a healthy smile.
          </Typography>
          <Divider sx={{ width: '60%', mx: 'auto', mb: 3, borderColor: 'divider' }} />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <FilterAltIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="subtitle1" color="text.primary">
              Filter by topic:
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
            {allTags.map((tag) => {
              const active = activeFilters.includes(tag);
              return (
                <Chip
                  key={tag}
                  label={tag}
                  onClick={() => handleFilterToggle(tag)}
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
        </Box>
      </GradientMesh>

      {/* Article Dialog */}
      <Dialog
        fullScreen={isMobile}
        open={openDialog}
        onClose={handleCloseDialog}
        slots={{ transition: Transition }}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: isMobile ? 0 : 2, overflow: 'hidden' }
          }
        }}
      >
        {isMobile ? (
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleCloseDialog}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                {selectedArticle?.title}
              </Typography>
            </Toolbar>
          </AppBar>
        ) : (
          <DialogTitle sx={{
            pb: 0,
            pt: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            color: 'primary.main',
            fontWeight: 600
          }}>
            {selectedArticle?.title}
            <IconButton onClick={handleCloseDialog} sx={{ ml: 2 }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
        )}

        <DialogContent sx={{ px: isMobile ? 2 : 3, pt: isMobile ? 2 : 3 }}>
          {selectedArticle && (
            <>
              {selectedArticle.tags && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {selectedArticle.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{
                        fontSize: '0.75rem',
                        height: 24
                      }}
                    />
                  ))}
                </Box>
              )}

              <CardMedia
                component="img"
                image={selectedArticle.fullImg}
                alt={selectedArticle.title}
                sx={{
                  width: '100%',
                  height: 300,
                  borderRadius: 1,
                  mb: 3,
                  objectFit: 'cover',
                  boxShadow: 2
                }}
              />

              {selectedArticle.content.split('\n\n').map((paragraph, idx) => (
                <Typography
                  key={idx}
                  variant="body1"
                  sx={{
                    lineHeight: 1.8,
                    fontSize: '1.05rem',
                    mb: 2
                  }}
                >
                  {paragraph}
                </Typography>
              ))}
            </>
          )}
        </DialogContent>

        {!isMobile && (
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog} variant="outlined">Close</Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Articles Grid */}
      <Grid container spacing={3}>
        {filteredArticles.length === 0 ? (
          <Box sx={{
            width: '100%',
            py: 10,
            textAlign: 'center'
          }}>
            <Typography variant="h6" color="text.primary">
              No articles match your selected filters.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setActiveFilters([])}
              sx={{ mt: 2 }}
            >
              Clear Filters
            </Button>
          </Box>
        ) : (
          filteredArticles.map((article) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={article.title}>
              <Fade in={visibleArticles.includes(articles.indexOf(article))} timeout={500}>
                <Card
                  elevation={2}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: 4
                    },
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'background.paper'
                  }}
                >
                  <CardMedia
                    component="img"
                    height="180"
                    image={article.img}
                    alt={article.title}
                    loading="lazy"
                    decoding="async"
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
                    <Box sx={{ mb: 1.5 }}>
                      {article.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{
                            mr: 0.5,
                            mb: 0.5,
                            fontSize: '0.75rem',
                            height: 24
                          }}
                        />
                      ))}
                    </Box>

                    <Typography
                      variant="h6"
                      component="h2"
                      gutterBottom
                      sx={{
                        fontWeight: 600,
                        color: 'primary.main',
                        fontSize: '1.1rem',
                        lineHeight: 1.3
                      }}
                    >
                      {article.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, flexGrow: 1 }}
                    >
                      {article.content.split('.')[0] + '...'}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => handleReadMore(article)}
                      sx={{
                        alignSelf: 'flex-start',
                        borderRadius: 6,
                        px: 2
                      }}
                    >
                      Read More
                    </Button>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
};

export default Learn;
