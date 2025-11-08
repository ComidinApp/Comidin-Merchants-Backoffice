import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { _pricingPlans } from 'src/_mock';
import PricingCard from './pricing-card';

export default function PricingView() {
  return (
    <Container sx={{ pt: 15, pb: 10, minHeight: 1 }}>
      <Typography variant="h3" align="center" sx={{ mb: 2 }}>
        Suscripciones flexibles para el
        <br /> tamaño y necesidades de tu comercio
      </Typography>

      <Typography align="center" sx={{ color: 'text.secondary' }}>
        Elegí tu suscripción y maximizá el alcance de tu negocio!
      </Typography>

      <Box
        gap={{ xs: 3, md: 0 }}
        display="grid"
        alignItems={{ md: 'center' }}
        gridTemplateColumns={{ md: 'repeat(3, 1fr)' }}
      >
        {_pricingPlans.map((card) => (
          <PricingCard key={card.subscription} card={card} />
        ))}
      </Box>
    </Container>
  );
}
