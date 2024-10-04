import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useGetCommerce } from 'src/api/commerce';
import { COMMERCE_PUBLISH_OPTIONS } from 'src/_mock/_commerce';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import { useSettingsContext } from 'src/components/settings';

import { CommerceDetailsSkeleton } from '../commerce-skeleton';
import CommerceDetailsReview from '../commerce-details-review';
import CommerceDetailsSummary from '../commerce-details-summary';
import CommerceDetailsToolbar from '../commerce-details-toolbar';
import CommerceDetailsCarousel from '../commerce-details-carousel';
import CommerceDetailsDescription from '../commerce-details-description';

// ----------------------------------------------------------------------

const SUMMARY = [
  {
    title: '100% Original',
    description: 'Chocolate bar candy canes ice cream toffee cookie halvah.',
    icon: 'solar:verified-check-bold',
  },
  {
    title: '10 Day Replacement',
    description: 'Marshmallow biscuit donut dragée fruitcake wafer.',
    icon: 'solar:clock-circle-bold',
  },
  {
    title: 'Year Warranty',
    description: 'Cotton candy gingerbread cake I love sugar sweet.',
    icon: 'solar:shield-check-bold',
  },
];

// ----------------------------------------------------------------------

export default function CommerceDetailsView({ id }) {
  const { commerce, commerceLoading, commerceError } = useGetCommerce(id);

  const settings = useSettingsContext();

  const [currentTab, setCurrentTab] = useState('description');

  const [publish, setPublish] = useState('');

  useEffect(() => {
    if (commerce) {
      setPublish(commerce?.publish);
    }
  }, [commerce]);

  const handleChangePublish = useCallback((newValue) => {
    setPublish(newValue);
  }, []);

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  const renderSkeleton = <CommerceDetailsSkeleton />;

  const renderError = (
    <EmptyContent
      filled
      title={`${commerceError?.message}`}
      action={
        <Button
          component={RouterLink}
          href={paths.dashboard.commerce.root}
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={16} />}
          sx={{ mt: 3 }}
        >
          Back to List
        </Button>
      }
      sx={{ py: 10 }}
    />
  );

  const renderCommerce = commerce && (
    <>
      <CommerceDetailsToolbar
        backLink={paths.dashboard.commerce.root}
        editLink={paths.dashboard.commerce.edit(`${commerce?.id}`)}
        liveLink={paths.commerce.details(`${commerce?.id}`)}
        publish={publish || ''}
        onChangePublish={handleChangePublish}
        publishOptions={COMMERCE_PUBLISH_OPTIONS}
      />

      <Grid container spacing={{ xs: 3, md: 5, lg: 8 }}>
        <Grid xs={12} md={6} lg={7}>
          <CommerceDetailsCarousel commerce={commerce} />
        </Grid>

        <Grid xs={12} md={6} lg={5}>
          <CommerceDetailsSummary disabledActions commerce={commerce} />
        </Grid>
      </Grid>

      <Box
        gap={5}
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          md: 'repeat(3, 1fr)',
        }}
        sx={{ my: 10 }}
      >
        {SUMMARY.map((item) => (
          <Box key={item.title} sx={{ textAlign: 'center', px: 5 }}>
            <Iconify icon={item.icon} width={32} sx={{ color: 'primary.main' }} />

            <Typography variant="subtitle1" sx={{ mb: 1, mt: 2 }}>
              {item.title}
            </Typography>

            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {item.description}
            </Typography>
          </Box>
        ))}
      </Box>

      <Card>
        <Tabs
          value={currentTab}
          onChange={handleChangeTab}
          sx={{
            px: 3,
            boxShadow: (theme) => `inset 0 -2px 0 0 ${alpha(theme.palette.grey[500], 0.08)}`,
          }}
        >
          {[
            {
              value: 'description',
              label: 'Description',
            },
            {
              value: 'reviews',
              label: `Reviews (${commerce.reviews.length})`,
            },
          ].map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} />
          ))}
        </Tabs>

        {currentTab === 'description' && (
          <CommerceDetailsDescription description={commerce?.description} />
        )}

        {currentTab === 'reviews' && (
          <CommerceDetailsReview
            ratings={commerce.ratings}
            reviews={commerce.reviews}
            totalRatings={commerce.totalRatings}
            totalReviews={commerce.totalReviews}
          />
        )}
      </Card>
    </>
  );

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      {commerceLoading && renderSkeleton}

      {commerceError && renderError}

      {commerce && renderCommerce}
    </Container>
  );
}

CommerceDetailsView.propTypes = {
  id: PropTypes.string,
};
