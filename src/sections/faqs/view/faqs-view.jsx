import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import FaqsHero from '../faqs-hero';
import FaqsList from '../faqs-list';

// ----------------------------------------------------------------------

export default function FaqsView() {
  return (
    <>
      <FaqsHero />

      <Container
        sx={{
          pb: 10,
          position: 'relative',
        }}
      >
        <Typography
          variant="h3"
          sx={{
            my: { xs: 5, md: 10 },
          }}
        >
          Preguntas frecuentes
        </Typography>

        <Box
          gap={10}
          display="grid"
          gridTemplateColumns={{
            xs: 'repeat(1, 1fr)',
            md: 'repeat(1, 1fr)',
          }}
        >
          <FaqsList />

          {/* <FaqsForm /> */}
        </Box>
      </Container>
    </>
  );
}
