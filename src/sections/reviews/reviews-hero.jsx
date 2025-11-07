import PropTypes from 'prop-types';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';


export function ReviewsHero({ placeId, rating, total }) {
const writeUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
return (
<Card sx={{ p: 3, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
<Stack>
<Typography variant="overline" color="text.secondary">Puntuacion del comercio</Typography>
<Stack direction="row" spacing={1} alignItems="center">
<Typography variant="h5">{Number(rating || 0).toFixed(1)}</Typography>
<Rating value={Number(rating || 0)} readOnly precision={0.1} />
<Typography variant="body2" color="text.secondary">Basado en {total || 0} reseñas</Typography>
</Stack>
</Stack>
</Card>
);
}


ReviewsHero.propTypes = {
placeId: PropTypes.string,
rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
total: PropTypes.number,
};