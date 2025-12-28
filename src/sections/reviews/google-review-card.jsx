import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';

export default function ReviewCard({ review }) {
  const { product_image_url, product_name, rate_order, comment } = review;

  return (
    <Card elevation={1} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
      <Stack alignItems="center" spacing={2} sx={{ height: '100%' }}>
        <Box
          component="img"
          src={product_image_url}
          alt={product_name}
          sx={{
            width: 80,
            height: 80,
            borderRadius: 2,
            objectFit: 'cover',
            bgcolor: 'grey.100',
          }}
        />
        <Stack spacing={0.5} alignItems="center" sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={600} textAlign="center">
            {product_name}
          </Typography>
          <Rating value={Number(rate_order)} readOnly precision={0.5} />
        </Stack>
        {comment && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              textAlign: 'center',
              fontStyle: 'italic',
              '&::before': { content: '"«"' },
              '&::after': { content: '"»"' },
            }}
          >
            {comment}
          </Typography>
        )}
        <Box
          component="img"
          src="/logo/logo_comidin.svg"
          alt="Comidin"
          sx={{ width: 40, opacity: 0.7, mt: 'auto' }}
        />
      </Stack>
    </Card>
  );
}

ReviewCard.propTypes = {
  review: PropTypes.shape({
    product_image_url: PropTypes.string,
    product_name: PropTypes.string,
    rate_order: PropTypes.number,
    comment: PropTypes.string,
  }).isRequired,
};