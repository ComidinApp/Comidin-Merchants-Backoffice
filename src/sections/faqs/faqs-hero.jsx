import { m } from 'framer-motion';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import { alpha, useTheme } from '@mui/material/styles';

import { bgGradient } from 'src/theme/css';

import { varFade, MotionContainer } from 'src/components/animate';

// ----------------------------------------------------------------------

export default function FaqsHero() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        ...bgGradient({
          color: alpha(theme.palette.grey[900], 0.8),
          imgUrl: '/assets/images/faqs/hero.jpg',
        }),
        height: { md: 360 },
        py: { xs: 10, md: 0 },
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Container component={MotionContainer}>
        <Box
          sx={{
            bottom: { md: 100 },
            position: { md: 'absolute' },
            textAlign: { xs: 'center', md: 'unset' },
          }}
        >
          <div>
            <TextAnimate text="Cómo" sx={{ color: 'primary.main' }} variants={varFade().inRight} />
            <br />

            <Stack spacing={2} display="inline-flex" direction="row" sx={{ color: 'common.white' }}>
              <TextAnimate text="podemos" />
              <TextAnimate text="ayudarte?" />
            </Stack>
          </div>

        </Box>
      </Container>
    </Box>
  );
}

// ----------------------------------------------------------------------

function TextAnimate({ text, variants, sx, ...other }) {
  return (
    <Box
      component={m.div}
      sx={{
        typography: 'h1',
        overflow: 'hidden',
        display: 'inline-flex',
        ...sx,
      }}
      {...other}
    >
      {text.split('').map((letter, index) => (
        <m.span key={index} variants={variants || varFade().inUp}>
          {letter}
        </m.span>
      ))}
    </Box>
  );
}

TextAnimate.propTypes = {
  sx: PropTypes.object,
  text: PropTypes.string,
  variants: PropTypes.object,
};
