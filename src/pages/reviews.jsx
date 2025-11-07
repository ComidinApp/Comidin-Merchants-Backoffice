import { useEffect, useMemo, useState } from 'react';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Pagination from '@mui/material/Pagination';
import { Helmet } from 'react-helmet-async';

import { getGoogleReviews } from 'src/api/reviews';
import GoogleReviewCard from 'src/sections/reviews/google-review-card';
import { ReviewsHero } from 'src/sections/reviews/reviews-hero';

const PAGE_SIZE = 6;

export default function ReviewsPage() {
  const [data, setData] = useState({ rating: 0, totalReviews: 0, reviews: [] });
  const [page, setPage] = useState(1);
  const placeId = import.meta.env.VITE_GOOGLE_PLACE_ID;

  useEffect(() => {
    (async () => {
      try {
        const r = await getGoogleReviews(placeId);
        setData(r);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [placeId]);

  // volver a la primera página si cambian las reviews
  useEffect(() => setPage(1), [data.reviews]);

  const totalPages = Math.max(1, Math.ceil((data.reviews?.length || 0) / PAGE_SIZE));

  const visibleReviews = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return (data.reviews || []).slice(start, start + PAGE_SIZE);
  }, [data.reviews, page]);

  return (
    <>
      <Helmet><title> Reviews </title></Helmet>
      <Container sx={{ py: 5 }}>
        <ReviewsHero placeId={placeId} rating={data.rating} total={data.totalReviews} />

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {visibleReviews.map((rv) => (
            <Grid key={rv.id} xs={12} sm={6} md={4}>
              <GoogleReviewCard review={rv} />
            </Grid>
          ))}
        </Grid>

        <Stack alignItems="center" sx={{ mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
          />
        </Stack>
      </Container>
    </>
  );
}
