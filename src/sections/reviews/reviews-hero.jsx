import PropTypes from 'prop-types';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';

export function ReviewsHero({ rating, total }) {
  return (
    <Card sx={{ p: 3, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
      <Stack>
        <Typography variant="overline" color="text.secondary">
          Puntuación del comercio
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h5">{Number(rating || 0).toFixed(1)}</Typography>
          <Rating value={Number(rating || 0)} readOnly precision={0.1} />
          <Typography variant="body2" color="text.secondary">
            Basado en {total || 0} reseña{total !== 1 ? 's' : ''}
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
}

ReviewsHero.propTypes = {
  rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  total: PropTypes.number,
};