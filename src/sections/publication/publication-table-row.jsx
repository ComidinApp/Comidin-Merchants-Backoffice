import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';
import LinearProgress from '@mui/material/LinearProgress';

import { fCurrency } from 'src/utils/format-number';
import { fTime, fDate } from 'src/utils/format-time';

import Label from 'src/components/label';

// ----------------------------------------------------------------------

export function RenderCellPrice({ params }) {
  return <>{fCurrency(params.row.price)}</>;
}

RenderCellPrice.propTypes = {
  params: PropTypes.shape({
    row: PropTypes.object,
  }),
};

export function RenderCellDiscountedPrice({ params }) {
  return <>{fCurrency(params.row.discounted_price)}</>;
}

RenderCellDiscountedPrice.propTypes = {
  params: PropTypes.shape({
    row: PropTypes.object,
  }),
};

export function RenderCellDiscount({ params }) {
  const discount = params.row.discount_percentaje || 0;
  return <>{`${discount}%`}</>;
}

RenderCellDiscount.propTypes = {
  params: PropTypes.shape({
    row: PropTypes.object,
  }),
};

export function RenderCellPublish({ params }) {
  return (
    <Label variant="soft" color={(params.row.is_active === 'active' && 'info') || 'default'}>
      {params.row.is_active}
    </Label>
  );
}

RenderCellPublish.propTypes = {
  params: PropTypes.shape({
    row: PropTypes.object,
  }),
};

export function RenderCellCreatedAt({ params }) {
  return (
    <ListItemText
      primary={fDate(params.row.expiration_date)}
      secondary={fTime(params.row.expiration_date)}
      primaryTypographyProps={{ typography: 'body2', noWrap: true }}
      secondaryTypographyProps={{
        mt: 0.5,
        component: 'span',
        typography: 'caption',
      }}
    />
  );
}

RenderCellCreatedAt.propTypes = {
  params: PropTypes.shape({
    row: PropTypes.object,
  }),
};

export function RenderCellStock({ params }) {
  const stockPercentage = (params.row.available_stock * 100) / 300;

  let stockStatus;
  let stockColor;

  if (stockPercentage <= 20) {
    stockStatus = 'Out of stock';
    stockColor = 'error';
  } else if (stockPercentage <= 50) {
    stockStatus = 'Low stock';
    stockColor = 'warning';
  } else {
    stockStatus = 'In stock';
    stockColor = 'success';
  }

  return (
    <Stack sx={{ typography: 'caption', color: 'text.secondary', width: 80 }}>
      <LinearProgress
        value={stockPercentage}
        variant="determinate"
        color={stockColor}
        sx={{ mb: 1, height: 6, width: '100%' }} // La barra ocupa todo el ancho (80px)
      />
      {params.row.available_stock} <br />
      {stockStatus}
    </Stack>
  );
}

RenderCellStock.propTypes = {
  params: PropTypes.shape({
    row: PropTypes.object,
  }),
};

export function RenderCellPublication({ params }) {
  return (
    <Stack direction="row" alignItems="center" sx={{ py: 2, width: 1 }}>
      <Avatar
        alt={params.row.product.image_url}
        src={params.row.product.image_url}
        variant="rounded"
        sx={{ width: 64, height: 64, mr: 2 }}
      />

      <ListItemText
        disableTypography
        primary={
          <Link
            noWrap
            color="inherit"
            variant="subtitle2"
            onClick={params.row.onViewRow}
            sx={{ cursor: 'pointer' }}
          >
            {params.row.product.name}
          </Link>
        }
        secondary={
          <Box component="div" sx={{ typography: 'body2', color: 'text.disabled' }}>
            {params.row.product.description}
          </Box>
        }
        sx={{ display: 'flex', flexDirection: 'column' }}
      />
    </Stack>
  );
}

RenderCellPublication.propTypes = {
  params: PropTypes.shape({
    row: PropTypes.object,
  }),
};
