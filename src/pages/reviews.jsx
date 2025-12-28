import { Helmet } from 'react-helmet-async';
import { useMemo, useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuthContext } from 'src/auth/hooks';
import { getCommerceRatings } from 'src/api/reviews';

import { ReviewsHero } from 'src/sections/reviews/reviews-hero';
import ReviewCard from 'src/sections/reviews/google-review-card';

const PAGE_SIZE = 6;

export default function ReviewsPage() {
  const auth = useAuthContext();
  const [data, setData] = useState({ averageRating: 0, totalRatings: 0, ratings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const commerceId =
    auth?.user?.commerce?.id ??
    auth?.user?.commerce_id ??
    auth?.commerce?.id ??
    auth?.commerce_id ??
    null;

  useEffect(() => {
    if (commerceId == null) {
      setLoading(false);
      setError('No se pudo determinar el comercio.');
      return undefined;
    }

    let alive = true;
    setLoading(true);
    setError('');

    (async () => {
      try {
        const r = await getCommerceRatings(commerceId);
        if (alive) {
          setData(r);
        }
      } catch (e) {
        console.error(e);
        if (alive) {
          setError(e?.message || 'Error al cargar las reseñas.');
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [commerceId]);

  // volver a la primera página si cambian las reviews
  useEffect(() => { setPage(1); }, [data.ratings]);

  const totalPages = Math.max(1, Math.ceil((data.ratings?.length || 0) / PAGE_SIZE));

  const visibleReviews = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return (data.ratings || []).slice(start, start + PAGE_SIZE);
  }, [data.ratings, page]);

  if (loading) {
    return (
      <>
        <Helmet><title> Reseñas </title></Helmet>
        <Container sx={{ py: 5, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Helmet><title> Reseñas </title></Helmet>
        <Container sx={{ py: 5 }}>
          <Typography color="error" variant="h6" textAlign="center">
            {error}
          </Typography>
        </Container>
      </>
    );
  }

  return (
    <>
      <Helmet><title> Reseñas </title></Helmet>
      <Container sx={{ py: 5 }}>
        <ReviewsHero rating={data.averageRating} total={data.totalRatings} />

        {data.ratings?.length === 0 ? (
          <Typography variant="body1" textAlign="center" sx={{ mt: 4 }} color="text.secondary">
            Aún no hay reseñas para tu comercio.
          </Typography>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {visibleReviews.map((rv, index) => (
                <Grid key={`${rv.product_name}-${index}`} xs={12} sm={6} md={4}>
                  <ReviewCard review={rv} />
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
          </>
        )}
      </Container>
    </>
  );
}
