import React, { ChangeEvent, KeyboardEvent } from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { TOUCH_TARGETS } from '../../utils/mobileOptimization';

interface SearchSectionProps {
  searchKeywords: string;
  setSearchKeywords: (keywords: string) => void;
  loading: boolean;
  error?: string;
  onSearch: () => void;
  onKeyPress: (event: KeyboardEvent<HTMLInputElement>) => void;
  onClearResults: () => void;
  isMobile: boolean;
}

/**
 * SearchSection Component
 *
 * Responsive search interface with:
 * - Mobile-first design with proper touch targets
 * - Auto-search functionality with debouncing
 * - Loading states and error handling
 * - Accessibility features (ARIA labels, semantic HTML)
 * - Clear search functionality
 */
const SearchSection = React.memo<SearchSectionProps>(({
  searchKeywords,
  setSearchKeywords,
  loading,
  error = '',
  onSearch,
  onKeyPress,
  onClearResults,
  isMobile
}) => {

  const handleClear = (): void => {
    setSearchKeywords('');
    onClearResults();
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: 3,
        borderRadius: 2,
      }}
    >
      <Box>
        <Box 
          sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 2 }, 
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' }
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Start typing to search clinics (auto-search enabled)..."
            value={searchKeywords}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchKeywords(e.target.value)}
            onKeyPress={onKeyPress}
            slotProps={{
              htmlInput: {
                'aria-label': 'Search for dental clinics',
                type: 'search',
                autoComplete: 'off',
              },
              input: {
                startAdornment: (
                  <SearchIcon
                    sx={{
                      mr: 1,
                      color: 'action.active',
                      fontSize: { xs: 20, sm: 24 }
                    }}
                  />
                ),
                endAdornment: (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {loading && (
                      <CircularProgress
                        size={isMobile ? 16 : 20}
                        sx={{ mr: 1 }}
                      />
                    )}
                    {searchKeywords && (
                      <Button
                        size="small"
                        onClick={handleClear}
                        sx={{
                          minWidth: 'auto',
                          p: 0.5,
                          color: 'action.active'
                        }}
                        aria-label="Clear search"
                      >
                        <ClearIcon fontSize="small" />
                      </Button>
                    )}
                  </Box>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                minHeight: { xs: TOUCH_TARGETS.MINIMUM, sm: 56 },
                fontSize: { xs: '16px', sm: '14px' }, // Prevent zoom on iOS
              }
            }}
          />
          
          <Button
            variant="contained"
            onClick={onSearch}
            disabled={loading || !searchKeywords.trim()}
            sx={{ 
              minWidth: { xs: '100%', sm: 120 },
              minHeight: { xs: TOUCH_TARGETS.MINIMUM, sm: 56 },
              fontSize: { xs: '1rem', sm: '0.875rem' },
              fontWeight: 500,
            }}
            aria-label="Search for clinics"
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </Box>
        
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ 
            mt: 1, 
            display: 'block',
            textAlign: { xs: 'center', sm: 'left' },
            fontSize: { xs: '0.75rem', sm: '0.75rem' }
          }}
        >
          Search happens automatically after you stop typing.
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mt: 2,
            '& .MuiAlert-message': {
              fontSize: { xs: '0.875rem', sm: '0.875rem' }
            }
          }}
          role="alert"
          aria-live="polite"
        >
          {error}
        </Alert>
      )}
    </Paper>
  );
});

SearchSection.displayName = 'SearchSection';

export default SearchSection;
