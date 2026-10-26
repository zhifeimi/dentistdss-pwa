import React, { useState, useEffect, useRef } from 'react';
import {
  alpha,
  Container,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Radio,
  Box,
  LinearProgress,
  useTheme,
  FormControl
} from '@mui/material';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswers: string[];
}

interface UserAnswers {
  [questionId: string]: string;
}

// Questions data as provided previously
const userProvidedQuestions = [
  {
    q: '🪥 How often do you brush your teeth daily?',
    a: ['Once', 'Twice', 'More than twice'],
    correct: ['Twice', 'More than twice']
  },
  { q: '🧵 Do you floss daily?', a: ['Yes', 'No'], correct: ['Yes'] },
  { q: '🦷 How often do you visit the dentist?', a: ['Yearly', 'Every few years', 'Never'], correct: ['Yearly'] },
  { q: '🍭 Do you eat sugary snacks often?', a: ['Yes', 'No', 'Sometimes'], correct: ['No'] },
  { q: '🧃 Do you drink soft drinks regularly?', a: ['Yes', 'No'], correct: ['No'] },
  {
    q: '⏰ How long do you brush your teeth each time?',
    a: ['Less than 1 min', '1-2 mins', 'More than 2 mins'],
    correct: ['1-2 mins', 'More than 2 mins']
  },
  { q: '😬 Do your gums bleed while brushing?', a: ['Yes', 'No'], correct: ['No'] },
  { q: '🛌 Do you brush before going to bed?', a: ['Yes', 'No'], correct: ['Yes'] },
  {
    q: '👶 Do your children also follow proper dental hygiene?',
    a: ['Yes', 'No', 'I don\'t have kids'],
    correct: ['Yes', 'I don\'t have kids']
  },
  {
    q: '📆 When was your last dental check-up?',
    a: ['Within 6 months', '1 year ago', 'More than 1 year ago'],
    correct: ['Within 6 months']
  },
  { q: '🪞 Do you check your teeth for plaque or tartar?', a: ['Yes', 'No'], correct: ['Yes'] },
  { q: '🪥 What kind of toothbrush do you use?', a: ['Manual', 'Electric', 'Other'], correct: ['Electric'] },
  { q: '🧼 Do you use mouthwash daily?', a: ['Yes', 'No'], correct: ['Yes'] },
  { q: '🍽️ Do you brush your teeth after meals?', a: ['Yes', 'Sometimes', 'No'], correct: ['Yes'] },
  { q: '🦠 Have you ever had a cavity filled?', a: ['Yes', 'No'], correct: ['No'] },
  { q: '🧀 Do you consume a lot of dairy products?', a: ['Yes', 'No'], correct: ['Yes'] },
  { q: '😷 Do you suffer from bad breath often?', a: ['Yes', 'No'], correct: ['No'] },
  { q: '💧 Do you drink enough water daily?', a: ['Yes', 'No'], correct: ['Yes'] },
  { q: '😴 Do you grind your teeth while sleeping?', a: ['Yes', 'No', 'I don\'t know'], correct: ['No'] },
  { q: '🪥 Do you replace your toothbrush every 3 months?', a: ['Yes', 'No'], correct: ['Yes'] }
];

const quizQuestions: QuizQuestion[] = userProvidedQuestions.map((item, index) => ({
  id: `q${index + 1}`,
  question: item.q,
  options: item.a,
  correctAnswers: item.correct,
}));

/**
 * Quiz - Interactive dental health quiz
 * 
 * Features:
 * - 20 dental health questions with multiple choice answers
 * - Auto-advance functionality after answer selection
 * - Progress tracking with visual progress bar
 * - Detailed results with correct/incorrect answers
 * - Retake functionality
 * - Responsive design with dark mode support
 */
const Quiz: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [showResults, setShowResults] = useState<boolean>(false);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleOptionSelect = (questionId: string, answer: string) => {
    setUserAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: answer,
    }));

    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }

    if (questionId === quizQuestions[currentQuestionIndex].id) {
      autoAdvanceTimerRef.current = setTimeout(() => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
          setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        } else {
          setShowResults(true);
        }
      }, 200); // Auto-advance after 0.2 seconds
    }
  };

  useEffect(() => {
    // Clear timer if the current question changes for reasons other than auto-advance itself
    // or if component unmounts
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, [currentQuestionIndex]);

  const handlePreviousQuestion = () => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    setCurrentQuestionIndex(prevIndex => prevIndex - 1);
  };

  const handleNextQuestion = () => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      setShowResults(true); // Should be "View Results" button
    }
  };

  const handleRetakeQuiz = () => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
  };

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

  const card = {
    p: { xs: 2.5, sm: 4 },
    bgcolor: 'background.paper',
    border: 1,
    borderColor: 'divider',
    borderRadius: 2,
  } as const;

  if (showResults) {
    let score = 0;
    quizQuestions.forEach(q => {
      if (q.correctAnswers.includes(userAnswers[q.id])) {
        score++;
      }
    });

    return (
      <Container component="main" maxWidth="md" sx={{ py: { xs: 3, sm: 6 } }}>
        <Box sx={card}>
          <Typography variant="h4" component="h1">
            Your results
          </Typography>
          <Typography sx={{ mt: 1, color: 'text.secondary' }}>
            Your habits match our recommendation on {score} of {quizQuestions.length} questions.
          </Typography>
          <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, mt: 3 }}>
            {quizQuestions.map(q => {
              const userAnswer = userAnswers[q.id];
              const isCorrect = userAnswer !== undefined && q.correctAnswers.includes(userAnswer);
              const tone = isCorrect ? 'success.main' : 'error.main';
              return (
                <Box
                  component="li"
                  key={q.id}
                  sx={{ py: 2, pl: 2, borderTop: 1, borderColor: 'divider', position: 'relative' }}
                >
                  <Box sx={{ position: 'absolute', left: 0, top: 16, bottom: 16, width: 3, borderRadius: 1, bgcolor: tone }} />
                  <Typography sx={{ fontWeight: 650 }}>{q.question}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                    Your answer:{' '}
                    <Box component="span" sx={{ fontWeight: 650, color: tone }}>
                      {userAnswer || 'Not answered'}
                    </Box>
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    We recommend:{' '}
                    <Box component="span" sx={{ fontWeight: 650, color: 'text.primary' }}>
                      {q.correctAnswers.join(', ')}
                    </Box>
                  </Typography>
                </Box>
              );
            })}
          </Box>
          <Button variant="contained" onClick={handleRetakeQuiz} sx={{ mt: 3 }}>
            Retake quiz
          </Button>
        </Box>
      </Container>
    );
  }

  if (!currentQuestion) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6">Loading quiz…</Typography>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="md" sx={{ py: { xs: 3, sm: 6 } }}>
      <Box sx={card}>
        <Typography variant="h4" component="h1">
          Dental hygiene quiz
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          Question {currentQuestionIndex + 1} of {quizQuestions.length}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progress}
          aria-label="Quiz progress"
          sx={{ mt: 1.5, mb: 4, height: 6, borderRadius: 3 }}
        />

        <FormControl component="fieldset" fullWidth>
          <FormLabel
            component="legend"
            sx={{ typography: 'h6', color: 'text.primary', mb: 2, '&.Mui-focused': { color: 'text.primary' } }}
          >
            {currentQuestion.question}
          </FormLabel>
          <RadioGroup
            name={`question-${currentQuestion.id}`}
            value={userAnswers[currentQuestion.id] || ''}
            onChange={(e) => handleOptionSelect(currentQuestion.id, e.target.value)}
            sx={{ gap: 1.5 }}
          >
            {currentQuestion.options.map((option) => {
              const selected = userAnswers[currentQuestion.id] === option;
              return (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio />}
                  label={option}
                  sx={{
                    m: 0,
                    px: 1,
                    py: 0.5,
                    border: 1,
                    borderRadius: 1,
                    borderColor: selected ? 'primary.main' : 'divider',
                    bgcolor: selected ? alpha(theme.palette.primary.main, isDarkMode ? 0.16 : 0.08) : 'transparent',
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                />
              );
            })}
          </RadioGroup>
        </FormControl>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button variant="outlined" onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
            Previous
          </Button>
          {currentQuestionIndex < quizQuestions.length - 1 ? (
            <Button variant="contained" onClick={handleNextQuestion}>
              Next
            </Button>
          ) : (
            <Button variant="contained" onClick={() => setShowResults(true)}>
              See results
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Quiz;
