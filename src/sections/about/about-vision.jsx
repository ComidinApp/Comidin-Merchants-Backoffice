import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
// import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { varFade, MotionViewport } from 'src/components/animate';

// ----------------------------------------------------------------------

export default function AboutVision() {
  // const theme = useTheme();

  const renderVideo = (
    <Box
      sx={{

        position: 'relative',
        paddingTop: '56.25%', // Aspect ratio 16:9
        width: '100%',
        height: 0,
        overflow: 'hidden',
      }}
    >
      <iframe
        title="About Vision Video" // Añadido para accesibilidad
        src="https://www.youtube.com/embed/oHyK-3e1Y7I"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </Box>
  );

  return (
    <Box
      sx={{
        pb: 10,
        position: 'relative',
        bgcolor: 'background.neutral',
        '&:before': {
          top: 0,
          left: 0,
          width: 1,
          content: "''",
          position: 'absolute',
          height: { xs: 80, md: 120 },
          bgcolor: 'background.default',
        },
      }}
    >
      <Container component={MotionViewport}>
        <Box
          sx={{
            marginTop:'20px',
            mb: 10,
            borderRadius: 2,
            display: 'flex',
            overflow: 'hidden',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {renderVideo}


        </Box>

        <m.div variants={varFade().inUp}>
          <Typography variant="h3" sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto' }}>
            Buscamos ofrecer productos de calidad a precios accesibles cuidando el medio ambiente.
          </Typography>
        </m.div>
      </Container>
    </Box>
  );
}
