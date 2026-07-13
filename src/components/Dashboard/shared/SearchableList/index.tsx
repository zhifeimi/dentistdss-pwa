import React, { useState, useMemo, ReactNode, ChangeEvent } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ListCard from '../ListCard';
import { filterItems } from '../../../../utils/dashboard/dashboardUtils';

interface SearchableListProps {
  /** Array of items to display and search */
  items?: any[];
  /** Function to render each item - receives (item, index) */
  renderItem: (item: any, index: number) => ReactNode;
  /** Fields to search in (dot notation supported) */
  searchFields?: string[];
  /** Placeholder text for search input */
  searchPlaceholder?: string;
  /** Message when no items exist */
  emptyMessage?: string;
  /** Message when search returns no results */
  emptySearchMessage?: string;
  /** Whether to show search input */
  showSearch?: boolean;
  /** Controlled search value */
  searchValue?: string;
  /** Controlled search change handler */
  onSearchChange?: (value: string) => void;
  /** Additional props passed to ListCard */
  [key: string]: any;
}

/**
 * SearchableList - A combination of search input and list display
 *
 * Features:
 * - Built-in search functionality
 * - Configurable search fields
 * - Debounced search for performance
 * - All ListCard features included
 */
const SearchableList: React.FC<SearchableListProps> = ({
  items = [],
  renderItem,
  searchFields = [],
  searchPlaceholder = "Search...",
  emptyMessage = "No items found.",
  emptySearchMessage = "No items match your search.",
  showSearch = true,
  searchValue: controlledSearchValue,
  onSearchChange: controlledOnSearchChange,
  ...listCardProps
}) => {
  const [internalSearchValue, setInternalSearchValue] = useState('');
  
  // Use controlled or internal search value
  const searchValue = controlledSearchValue !== undefined ? controlledSearchValue : internalSearchValue;
  const onSearchChange = controlledOnSearchChange || setInternalSearchValue;

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchValue.trim()) return items;
    return filterItems(items, searchValue, searchFields);
  }, [items, searchValue, searchFields]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  // Determine empty message based on search state
  const currentEmptyMessage = searchValue.trim() ? emptySearchMessage : emptyMessage;

  return (
    <Box>
      {showSearch && (
        <TextField
          fullWidth
          placeholder={searchPlaceholder}
          variant="outlined"
          size="small"
          value={searchValue}
          onChange={handleSearchChange}
          sx={{ mb: 3 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />
      )}
      
      <ListCard
        items={filteredItems}
        renderItem={renderItem}
        emptyMessage={currentEmptyMessage}
        {...listCardProps}
      />
    </Box>
  );
};

export default SearchableList;
