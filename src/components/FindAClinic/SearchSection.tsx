import React, { ChangeEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';

interface SearchSectionProps {
  searchKeywords: string;
  setSearchKeywords: (keywords: string) => void;
  loading: boolean;
  error?: string;
  onSearch: () => void;
  onClearResults: () => void;
}

/**
 * SearchSection — clinic search field. Typing searches after a short pause
 * (see useClinicSearch); Enter or the button searches immediately.
 */
const SearchSection = React.memo<SearchSectionProps>(({
  searchKeywords,
  setSearchKeywords,
  loading,
  error = '',
  onSearch,
  onClearResults,
}) => {

  const handleClear = (): void => {
    setSearchKeywords('');
    onClearResults();
  };

  return (
    <Box sx={{ mb: 3, maxWidth: 720 }}>
      <Box
        component="form"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
        sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}
      >
        <TextField
          fullWidth
          placeholder="Suburb, clinic or treatment"
          value={searchKeywords}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchKeywords(e.target.value)}
          slotProps={{
            htmlInput: {
              'aria-label': 'Search for dental clinics',
              type: 'search',
              autoComplete: 'off',
              enterKeyHint: 'search',
            },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: (loading || searchKeywords) && (
                <InputAdornment position="end" sx={{ gap: 0.5 }}>
                  {loading && <CircularProgress size={18} aria-label="Searching" />}
                  {searchKeywords && (
                    <IconButton size="small" onClick={handleClear} aria-label="Clear search">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading || !searchKeywords.trim()}
          aria-label="Search for clinics"
          sx={{ flexShrink: 0 }}
        >
          {loading ? 'Searching…' : 'Search'}
        </Button>
      </Box>
      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
        Results update as you type.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} role="alert">
          {error}
        </Alert>
      )}
    </Box>
  );
});

SearchSection.displayName = 'SearchSection';

export default SearchSection;
