import orderBy from 'lodash/orderBy';
import isEqual from 'lodash/isEqual';
import { useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import { useDebounce } from 'src/hooks/use-debounce';

import { useGetCommerces, useSearchCommerces } from 'src/api/commerce';
import {
  COMMERCE_SORT_OPTIONS,
  COMMERCE_COLOR_OPTIONS,
  COMMERCE_GENDER_OPTIONS,
  COMMERCE_RATING_OPTIONS,
  COMMERCE_CATEGORY_OPTIONS,
} from 'src/_mock';

import EmptyContent from 'src/components/empty-content';
import { useSettingsContext } from 'src/components/settings';

import CartIcon from '../common/cart-icon';
import CommerceList from '../commerce-list';
import CommerceSort from '../commerce-sort';
import CommerceSearch from '../commerce-search';
import CommerceFilters from '../commerce-filters';
import { useCheckoutContext } from '../../checkout/context';
import CommerceFiltersResult from '../commerce-filters-result';

// ----------------------------------------------------------------------

const defaultFilters = {
  gender: [],
  colors: [],
  rating: '',
  category: 'all',
  priceRange: [0, 200],
};

// ----------------------------------------------------------------------

export default function CommerceShopView() {
  const settings = useSettingsContext();

  const checkout = useCheckoutContext();

  const openFilters = useBoolean();

  const [sortBy, setSortBy] = useState('featured');

  const [searchQuery, setSearchQuery] = useState('');

  const debouncedQuery = useDebounce(searchQuery);

  const [filters, setFilters] = useState(defaultFilters);

  const { commerces, commercesLoading, commercesEmpty } = useGetCommerces();

  const { searchResults, searchLoading } = useSearchCommerces(debouncedQuery);

  const handleFilters = useCallback((name, value) => {
    setFilters((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const dataFiltered = applyFilter({
    inputData: commerces,
    filters,
    sortBy,
  });

  const canReset = !isEqual(defaultFilters, filters);

  const notFound = !dataFiltered.length && canReset;

  const handleSortBy = useCallback((newValue) => {
    setSortBy(newValue);
  }, []);

  const handleSearch = useCallback((inputValue) => {
    setSearchQuery(inputValue);
  }, []);

  const renderFilters = (
    <Stack
      spacing={3}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-end', sm: 'center' }}
      direction={{ xs: 'column', sm: 'row' }}
    >
      <CommerceSearch
        query={debouncedQuery}
        results={searchResults}
        onSearch={handleSearch}
        loading={searchLoading}
        hrefItem={(id) => paths.commerce.details(id)}
      />

      <Stack direction="row" spacing={1} flexShrink={0}>
        <CommerceFilters
          open={openFilters.value}
          onOpen={openFilters.onTrue}
          onClose={openFilters.onFalse}
          //
          filters={filters}
          onFilters={handleFilters}
          //
          canReset={canReset}
          onResetFilters={handleResetFilters}
          //
          colorOptions={COMMERCE_COLOR_OPTIONS}
          ratingOptions={COMMERCE_RATING_OPTIONS}
          genderOptions={COMMERCE_GENDER_OPTIONS}
          categoryOptions={['all', ...COMMERCE_CATEGORY_OPTIONS]}
        />

        <CommerceSort sort={sortBy} onSort={handleSortBy} sortOptions={COMMERCE_SORT_OPTIONS} />
      </Stack>
    </Stack>
  );

  const renderResults = (
    <CommerceFiltersResult
      filters={filters}
      onFilters={handleFilters}
      //
      canReset={canReset}
      onResetFilters={handleResetFilters}
      //
      results={dataFiltered.length}
    />
  );

  const renderNotFound = <EmptyContent filled title="No Data" sx={{ py: 10 }} />;

  return (
    <Container
      maxWidth={settings.themeStretch ? false : 'lg'}
      sx={{
        mb: 15,
      }}
    >
      <CartIcon totalItems={checkout.totalItems} />

      <Typography
        variant="h4"
        sx={{
          my: { xs: 3, md: 5 },
        }}
      >
        Shop
      </Typography>

      <Stack
        spacing={2.5}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      >
        {renderFilters}

        {canReset && renderResults}
      </Stack>

      {(notFound || commercesEmpty) && renderNotFound}

      <CommerceList commerces={dataFiltered} loading={commercesLoading} />
    </Container>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, filters, sortBy }) {
  const { gender, category, colors, priceRange, rating } = filters;

  const min = priceRange[0];

  const max = priceRange[1];

  // SORT BY
  if (sortBy === 'featured') {
    inputData = orderBy(inputData, ['totalSold'], ['desc']);
  }

  if (sortBy === 'newest') {
    inputData = orderBy(inputData, ['createdAt'], ['desc']);
  }

  if (sortBy === 'priceDesc') {
    inputData = orderBy(inputData, ['price'], ['desc']);
  }

  if (sortBy === 'priceAsc') {
    inputData = orderBy(inputData, ['price'], ['asc']);
  }

  // FILTERS
  if (gender.length) {
    inputData = inputData.filter((commerce) => gender.includes(commerce.gender));
  }

  if (category !== 'all') {
    inputData = inputData.filter((commerce) => commerce.category === category);
  }

  if (colors.length) {
    inputData = inputData.filter((commerce) =>
      commerce.colors.some((color) => colors.includes(color))
    );
  }

  if (min !== 0 || max !== 200) {
    inputData = inputData.filter((commerce) => commerce.price >= min && commerce.price <= max);
  }

  if (rating) {
    inputData = inputData.filter((commerce) => {
      const convertRating = (value) => {
        if (value === 'up4Star') return 4;
        if (value === 'up3Star') return 3;
        if (value === 'up2Star') return 2;
        return 1;
      };
      return commerce.totalRatings > convertRating(rating);
    });
  }

  return inputData;
}
