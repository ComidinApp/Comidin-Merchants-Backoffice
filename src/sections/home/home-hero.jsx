import { m, useScroll } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import { alpha, styled, useTheme } from '@mui/material/styles';

import { useResponsive } from 'src/hooks/use-responsive';

import { HEADER } from 'src/layouts/config-layout';

import { varFade, MotionContainer } from 'src/components/animate';

// ----------------------------------------------------------------------

const StyledRoot = styled('div')(({ theme }) => ({
  backgroundColor: '#FEFAE0',
  width: '100%',
  height: '100vh',
  position: 'relative',
  [theme.breakpoints.up('md')]: {
    top: 0,
    left: 0,
    position: 'fixed',
  },
}));

const StyledWrapper = styled('div')(({ theme }) => ({
  height: '100%',
  overflow: 'hidden',
  position: 'relative',
  [theme.breakpoints.up('md')]: {
    marginTop: HEADER.H_DESKTOP_OFFSET,
  },
}));

const StyledEllipseTop = styled('div')(({ theme }) => ({
  top: -80,
  width: 480,
  right: -80,
  height: 480,
  borderRadius: '50%',
  position: 'absolute',
  filter: 'blur(100px)',
  WebkitFilter: 'blur(100px)',
  backgroundColor: alpha(theme.palette.primary.darker, 0.12),
}));

const StyledEllipseBottom = styled('div')(({ theme }) => ({
  height: 400,
  bottom: -200,
  left: '10%',
  right: '10%',
  borderRadius: '50%',
  position: 'absolute',
  filter: 'blur(100px)',
  WebkitFilter: 'blur(100px)',
  backgroundColor: alpha(theme.palette.primary.darker, 0.12),
}));

// const StyledPolygon = styled('div')(({ opacity = 1, anchor = 'left', theme }) => ({
//   ...bgBlur({
//     opacity,
//     color: theme.palette.background.default,
//   }),
//   zIndex: 9,
//   bottom: 0,
//   height: 80,
//   width: '50%',
//   position: 'absolute',
//   clipPath: 'polygon(0% 0%, 100% 100%, 0% 100%)',
//   ...(anchor === 'left' && {
//     left: 0,
//     ...(theme.direction === 'rtl' && {
//       transform: 'scale(-1, 1)',
//     }),
//   }),
//   ...(anchor === 'right' && {
//     right: 0,
//     transform: 'scaleX(-1)',
//     ...(theme.direction === 'rtl' && {
//       transform: 'scaleX(1)',
//     }),
//   }),
// }));

// ----------------------------------------------------------------------

export default function HomeHero() {
  const mdUp = useResponsive('up', 'md');

  const theme = useTheme();

  const heroRef = useRef(null);

  const { scrollY } = useScroll();

  const [percent, setPercent] = useState(0);

  const lightMode = theme.palette.mode === 'light';

  const getScroll = useCallback(() => {
    let heroHeight = 0;

    if (heroRef.current) {
      heroHeight = heroRef.current.offsetHeight;
    }

    scrollY.on('change', (scrollHeight) => {
      const scrollPercent = (scrollHeight * 100) / heroHeight;

      setPercent(Math.floor(scrollPercent));
    });
  }, [scrollY]);

  useEffect(() => {
    getScroll();
  }, [getScroll]);

  const transition = {
    repeatType: 'loop',
    ease: 'linear',
    duration: 60 * 4,
    repeat: Infinity,
  };

  const opacity = 1 - percent / 100;

  const hide = percent > 120;

  const renderDescription = (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{
        height: 1,
        mx: 'auto',
        maxWidth: 480,
        opacity: opacity > 0 ? opacity : 0,
        mt: {
          md: `-${HEADER.H_DESKTOP + percent * 2.5}px`,
        },
      }}
    >
      <m.div variants={varFade().in}>
        <Typography
          variant="h4"
          sx={{
            textAlign: 'center',
            fontFamily: theme.typography.fontFamily,
          }}
        >
          Salvá comida con
        </Typography>
      </m.div>

      <m.div variants={varFade().in}>
      <Box
            component="img"
            src="/logo/logo_comidin.svg"
            alt="Comidin"
            sx={{ width: 630, mt: 'auto', mb: 2 }}
          />
      </m.div>

      <m.div variants={varFade().in}>
        <Typography variant="body3" sx={{ textAlign: 'center' }}>
          Supermercados, restaurantes, panaderías, verdulerías
        </Typography>
      </m.div>
    </Stack>
  );

  const renderSlides = (
    <Stack
      direction="row"
      alignItems="flex-start"
      sx={{
        height: '150%',
        position: 'absolute',
        opacity: opacity > 0 ? opacity : 0,
        transform: `skew(${-16 - percent / 24}deg, ${4 - percent / 16}deg)`,
        ...(theme.direction === 'rtl' && {
          transform: `skew(${16 + percent / 24}deg, ${4 + percent / 16}deg)`,
        }),
      }}
    >
      <Stack
        component={m.div}
        variants={varFade().in}
        sx={{
          width: 344,
          position: 'relative',
          marginRight: 2,
        }}
      >
        <Box
          component={m.img}
          animate={{ y: ['0%', '100%'] }}
          transition={transition}
          alt={lightMode ? 'light_1' : 'dark_1'}
          src={
            lightMode
              ? `/assets/images/home/hero/home_light.webp`
              : `/assets/images/home/hero/home_light.webp`
          }
          sx={{ position: 'absolute', mt: -5 }}
        />
        <Box
          component={m.img}
          animate={{ y: ['-100%', '0%'] }}
          transition={transition}
          alt={lightMode ? 'light_1' : 'dark_1'}
          src={
            lightMode
              ? `/assets/images/home/hero/home_light.webp`
              : `/assets/images/home/hero/home_light.webp`
          }
          sx={{ position: 'absolute' }}
        />
      </Stack>

      <Stack
        component={m.div}
        variants={varFade().in}
        sx={{
          width: 700,
          position: 'relative',
          marginRight: 2,
        }}
      >
        <Box
          component={m.img}
          animate={{ y: ['100%', '0%'] }}
          transition={transition}
          alt={lightMode ? 'light_3' : 'dark_2'}
          src={
            lightMode
              ? `/assets/images/home/hero/light_3.webp`
              : `/assets/images/home/hero/light_3.webp`
          }
          sx={{ position: 'absolute', mt: -5 }}
        />
        <Box
          component={m.img}
          animate={{ y: ['0%', '-100%'] }}
          transition={transition}
          alt={lightMode ? 'light_2' : 'dark_2'}
          src={
            lightMode
              ? `/assets/images/home/hero/light_3.webp`
              : `/assets/images/home/hero/light_3.webp`
          }
          sx={{ position: 'absolute' }}
        />
      </Stack>
    </Stack>
  );

  // const renderPolygons = (
  //   <>
  //     <StyledPolygon />
  //     <StyledPolygon anchor="right" opacity={0.48} />
  //     <StyledPolygon anchor="right" opacity={0.48} sx={{ height: 48, zIndex: 10 }} />
  //     <StyledPolygon anchor="right" sx={{ zIndex: 11, height: 24 }} />
  //   </>
  // );

  const renderEllipses = (
    <>
      {mdUp && <StyledEllipseTop />}
      <StyledEllipseBottom />
    </>
  );

  return (
    <>
      <StyledRoot
        ref={heroRef}
        sx={{
          ...(hide && {
            opacity: 0,
          }),
        }}
      >
        <StyledWrapper>
          <Container component={MotionContainer} sx={{ height: 1 }}>
            <Grid container columnSpacing={{ md: 10 }} sx={{ height: 1 }}>
              <Grid xs={12} md={6}>
                {renderDescription}
              </Grid>

              {mdUp && <Grid md={6}>{renderSlides}</Grid>}
            </Grid>
          </Container>

          {renderEllipses}
        </StyledWrapper>
      </StyledRoot>

      <Box sx={{ height: { md: '100vh' } }} />
    </>
  );
}
