import { Helmet } from 'react-helmet-async';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import TextField from '@mui/material/TextField';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { usePermissions } from 'src/hooks/use-permissions';

import { useAuthContext } from 'src/auth/hooks';
import { useGetCommerces } from 'src/api/commerce';
import { deleteRating, getCommerceRatings } from 'src/api/reviews';

import { useSnackbar } from 'src/components/snackbar';

import { ReviewsHero } from 'src/sections/reviews/reviews-hero';
import ReviewCard from 'src/sections/reviews/google-review-card';

const PAGE_SIZE = 6;

export default function ReviewsPage() {
  const auth = useAuthContext();
  const { isAdmin } = usePermissions();
  const { enqueueSnackbar } = useSnackbar();

  const [data, setData] = useState({ averageRating: 0, totalRatings: 0, ratings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  // Estado para el selector de comercio (solo admin)
  const [selectedCommerce, setSelectedCommerce] = useState(null);

  // Obtener lista de comercios (solo para admin)
  const { commerces, commercesLoading } = useGetCommerces();

  // Determinar el commerceId a usar
  const userCommerceId =
    auth?.user?.commerce?.id ??
    auth?.user?.commerce_id ??
    auth?.commerce?.id ??
    auth?.commerce_id ??
    null;

  // Si es admin, usar el comercio seleccionado; si no, usar el del usuario
  const activeCommerceId = isAdmin ? selectedCommerce?.id : userCommerceId;

  // Función para cargar las reseñas
  const loadRatings = useCallback(async (commerceId) => {
    if (commerceId == null) {
      setLoading(false);
      if (!isAdmin) {
        setError('No se pudo determinar el comercio.');
      }
      return;
    }

    setLoading(true);
    setError('');

    try {
      const r = await getCommerceRatings(commerceId);
      setData(r);
    } catch (e) {
      console.error(e);
      setError(e?.message || 'Error al cargar las reseñas.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // Cargar reseñas cuando cambia el commerceId activo
  useEffect(() => {
    if (isAdmin && !selectedCommerce) {
      // Admin sin comercio seleccionado: no cargar nada
      setLoading(false);
      setData({ averageRating: 0, totalRatings: 0, ratings: [] });
      return;
    }

    loadRatings(activeCommerceId);
  }, [activeCommerceId, isAdmin, selectedCommerce, loadRatings]);

  // Volver a la primera página si cambian las reviews
  useEffect(() => {
    setPage(1);
  }, [data.ratings]);

  // Handler para eliminar una reseña
  const handleDeleteReview = useCallback(async (reviewId) => {
    try {
      await deleteRating(reviewId);
      enqueueSnackbar('Reseña eliminada correctamente', { variant: 'success' });
      // Recargar las reseñas
      loadRatings(activeCommerceId);
    } catch (e) {
      console.error(e);
      enqueueSnackbar(e?.message || 'Error al eliminar la reseña', { variant: 'error' });
    }
  }, [activeCommerceId, enqueueSnackbar, loadRatings]);

  const totalPages = Math.max(1, Math.ceil((data.ratings?.length || 0) / PAGE_SIZE));

  const visibleReviews = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return (data.ratings || []).slice(start, start + PAGE_SIZE);
  }, [data.ratings, page]);

  // Renderizar el selector de comercio para admin
  const renderCommerceSelector = () => {
    if (!isAdmin) return null;

    return (
      <Stack sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Seleccioná tu comercio
        </Typography>
        <Autocomplete
          value={selectedCommerce}
          onChange={(_, newValue) => setSelectedCommerce(newValue)}
          options={commerces || []}
          getOptionLabel={(option) => option?.name || ''}
          loading={commercesLoading}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Buscar comercio..."
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {commercesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ maxWidth: 400}}
        />
      </Stack>
    );
  };

  // Estado de carga inicial
  if (loading && !isAdmin) {
    return (
      <>
        <Helmet><title> Reseñas </title></Helmet>
        <Container sx={{ py: 5, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Container>
      </>
    );
  }

  // Error (solo para usuarios no admin)
  if (error && !isAdmin) {
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
        {renderCommerceSelector()}

        {/* Mensaje para admin cuando no ha seleccionado comercio */}
        {isAdmin && !selectedCommerce && (
          <Typography variant="body1" textAlign="center" sx={{ mt: 4 }} color="text.primary">
            Selecciona un comercio para ver sus reseñas.
          </Typography>
        )}

        {/* Mostrar loading mientras carga */}
        {loading && selectedCommerce && (
          <Stack alignItems="center" sx={{ mt: 4 }}>
            <CircularProgress />
          </Stack>
        )}

        {/* Mostrar error si hay */}
        {error && isAdmin && selectedCommerce && (
          <Typography color="error" variant="h6" textAlign="center" sx={{ mt: 4 }}>
            {error}
          </Typography>
        )}

        {/* Contenido de las reseñas */}
        {!loading && !error && (isAdmin ? selectedCommerce : true) && (
          <>
            <ReviewsHero rating={data.averageRating} total={data.totalRatings} />

            {data.ratings?.length === 0 ? (
              <Typography variant="body1" textAlign="center" sx={{ mt: 4 }} color="text.secondary">
                {isAdmin
                  ? 'No hay reseñas para este comercio.'
                  : 'Aún no hay reseñas para tu comercio.'
                }
              </Typography>
            ) : (
              <>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  {visibleReviews.map((rv, index) => (
                    <Grid key={rv.id || `${rv.product_name}-${index}`} xs={12} sm={6} md={4}>
                      <ReviewCard
                        review={rv}
                        canDelete={isAdmin}
                        onDelete={() => handleDeleteReview(rv.id)}
                      />
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
          </>
        )}
      </Container>
    </>
  );
}
