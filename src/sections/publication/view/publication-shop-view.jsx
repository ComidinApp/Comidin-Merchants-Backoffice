import orderBy from 'lodash/orderBy';
import isEqual from 'lodash/isEqual';
import { useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import { useDebounce } from 'src/hooks/use-debounce';

import { useGetProducts, useSearchProducts } from 'src/api/product';
import {
  PRODUCT_SORT_OPTIONS,
  PRODUCT_COLOR_OPTIONS,
  PRODUCT_GENDER_OPTIONS,
  PRODUCT_RATING_OPTIONS,
  PRODUCT_CATEGORY_OPTIONS,
} from 'src/_mock';

import EmptyContent from 'src/components/empty-content';
import { useSettingsContext } from 'src/components/settings';

import PublicationList from '../publication-list';
import PublicationSort from '../publication-sort';
import CartIcon from '../common/cart-icon';
import PublicationSearch from '../publication-search';
import PublicationFilters from '../publication-filters';
import { useCheckoutContext } from '../../checkout/context';
import PublicationFiltersResult from '../publication-filters-result';

// ----------------------------------------------------------------------

const defaultFilters = {
  gender: [],
  colors: [],
  rating: '',
  category: 'all',
  priceRange: [0, 200],
};

// ----------------------------------------------------------------------

export default function PublicationShopView() {
  const settings = useSettingsContext();

  const checkout = useCheckoutContext();

  const openFilters = useBoolean();

  const [sortBy, setSortBy] = useState('featured');

  const [searchQuery, setSearchQuery] = useState('');

  const debouncedQuery = useDebounce(searchQuery);

  const [filters, setFilters] = useState(defaultFilters);

  const { publications, publicationsLoading, publicationsEmpty } = useGetProducts();

  const { searchResults, searchLoading } = useSearchProducts(debouncedQuery);

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
    inputData: publications,
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
      <PublicationSearch
        query={debouncedQuery}
        results={searchResults}
        onSearch={handleSearch}
        loading={searchLoading}
        hrefItem={(id) => paths.publication.details(id)}
      />

      <Stack direction="row" spacing={1} flexShrink={0}>
        <PublicationFilters
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
          colorOptions={PRODUCT_COLOR_OPTIONS}
          ratingOptions={PRODUCT_RATING_OPTIONS}
          genderOptions={PRODUCT_GENDER_OPTIONS}
          categoryOptions={['all', ...PRODUCT_CATEGORY_OPTIONS]}
        />

        <PublicationSort sort={sortBy} onSort={handleSortBy} sortOptions={PRODUCT_SORT_OPTIONS} />
      </Stack>
    </Stack>
  );

  const renderResults = (
    <PublicationFiltersResult
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

      {(notFound || publicationsEmpty) && renderNotFound}

      <PublicationList publications={dataFiltered} loading={publicationsLoading} />
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
    inputData = inputData.filter((publication) => gender.includes(publication.gender));
  }

  if (category !== 'all') {
    inputData = inputData.filter((publication) => publication.category === category);
  }

  if (colors.length) {
    inputData = inputData.filter((publication) =>
      publication.colors.some((color) => colors.includes(color))
    );
  }

  if (min !== 0 || max !== 200) {
    inputData = inputData.filter(
      (publication) => publication.price >= min && publication.price <= max
    );
  }

  if (rating) {
    inputData = inputData.filter((publication) => {
      const convertRating = (value) => {
        if (value === 'up4Star') return 4;
        if (value === 'up3Star') return 3;
        if (value === 'up2Star') return 2;
        return 1;
      };
      return publication.totalRatings > convertRating(rating);
    });
  }

  return inputData;
}
