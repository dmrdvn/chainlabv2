import type { BoxProps } from '@mui/material/Box';

import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Rating from '@mui/material/Rating';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { fToNow } from 'src/utils/format-time';

import { _mock } from 'src/_mock';

import { varFade, MotionViewport, AnimateCountUp } from 'src/components/animate';
import {
  Carousel,
  useCarousel,
  CarouselDotButtons,
  carouselBreakpoints,
  CarouselArrowBasicButtons,
} from 'src/components/carousel';

import { SectionTitle } from './components/section-title';
import { FloatLine, FloatTriangleDownIcon } from './components/svg-elements';

// ----------------------------------------------------------------------

const renderLines = () => (
  <>
    <Stack
      spacing={8}
      alignItems="center"
      sx={{
        top: 64,
        left: 80,
        position: 'absolute',
        transform: 'translateX(-50%)',
      }}
    >
      <FloatTriangleDownIcon sx={{ position: 'static', opacity: 0.12 }} />
      <FloatTriangleDownIcon
        sx={{
          width: 30,
          height: 15,
          opacity: 0.24,
          position: 'static',
        }}
      />
    </Stack>

    <FloatLine vertical sx={{ top: 0, left: 80 }} />
  </>
);

export function HomeTestimonials({ sx, ...other }: BoxProps) {
  const carousel = useCarousel({
    align: 'start',
    slidesToShow: {
      xs: 1,
      sm: 2,
      md: 3,
      lg: 4,
    },
    breakpoints: {
      [carouselBreakpoints.sm]: { slideSpacing: '24px' },
      [carouselBreakpoints.md]: { slideSpacing: '40px' },
      [carouselBreakpoints.lg]: { slideSpacing: '64px' },
    },
  });

  const renderDescription = () => (
    <SectionTitle
      caption="testimonials"
      title="Rumors are flying"
      txtGradient="that..."
      sx={{ mb: { xs: 5, md: 8 }, textAlign: 'center' }}
    />
  );

  const horizontalDivider = (position: 'top' | 'bottom') => (
    <Divider
      component="div"
      sx={[
        (theme) => ({
          width: 1,
          opacity: 0.16,
          height: '1px',
          border: 'none',
          position: 'absolute',
          background: `linear-gradient(to right, transparent 0%, ${theme.vars.palette.grey[500]} 50%, transparent 100%)`,
          ...(position === 'top' && { top: 0 }),
          ...(position === 'bottom' && { bottom: 0 }),
        }),
      ]}
    />
  );

  const verticalDivider = () => (
    <Divider
      component="div"
      orientation="vertical"
      flexItem
      sx={[
        (theme) => ({
          width: '1px',
          opacity: 0.16,
          border: 'none',
          background: `linear-gradient(to bottom, transparent 0%, ${theme.vars.palette.grey[500]} 50%, transparent 100%)`,
          display: { xs: 'none', md: 'block' },
        }),
      ]}
    />
  );

  const renderContent = () => (
    <Stack sx={{ position: 'relative', py: { xs: 5, md: 8 } }}>
      {horizontalDivider('top')}

      <Carousel carousel={carousel}>
        {TESTIMONIALS.map((item) => (
          <Stack key={item.id} component={m.div} variants={varFade('in')}>
            <Stack spacing={1} sx={{ typography: 'subtitle2' }}>
              <Rating size="small" name="read-only" value={item.rating} precision={0.5} readOnly />
              {item.category}
            </Stack>

            <Typography
              sx={(theme) => ({
                ...theme.mixins.maxLine({ line: 4, persistent: theme.typography.body1 }),
                mt: 2,
                mb: 3,
              })}
            >
              {item.content}
            </Typography>

            <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
              <Avatar alt={item.name} src={item.avatar} sx={{ width: 48, height: 48 }} />
              <Stack sx={{ typography: 'subtitle1' }}>
                <Box component="span">{item.name}</Box>

                <Box component="span" sx={{ typography: 'body2', color: 'text.disabled' }}>
                  {fToNow(new Date(item.postedAt))}
                </Box>
              </Stack>
            </Box>
          </Stack>
        ))}
      </Carousel>

      <Box
        sx={{
          mt: { xs: 5, md: 8 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <CarouselDotButtons
          variant="rounded"
          scrollSnaps={carousel.dots.scrollSnaps}
          selectedIndex={carousel.dots.selectedIndex}
          onClickDot={carousel.dots.onClickDot}
        />

        <CarouselArrowBasicButtons {...carousel.arrows} options={carousel.options} />
      </Box>
    </Stack>
  );

  const renderNumber = () => (
    <Stack sx={{ py: { xs: 5, md: 8 }, position: 'relative' }}>
      {horizontalDivider('top')}

      <Stack
        divider={verticalDivider()}
        sx={{ gap: 5, flexDirection: { xs: 'column', md: 'row' } }}
      >
        {[
          { label: 'Supported blockchains', value: 15 },
          { label: 'Active developers', value: 100 },
          { label: 'Dev time saved', value: 85 },
        ].map((item) => (
          <Stack key={item.label} spacing={2} sx={{ textAlign: 'center', width: 1 }}>
            <m.div variants={varFade('inUp', { distance: 24 })}>
              <AnimateCountUp
                to={item.value}
                unit={
                  item.label === 'Supported blockchains'
                    ? '+'
                    : item.label === 'Active developers'
                      ? '+'
                      : '%'
                }
                toFixed={item.label === 'Active developers' ? 0 : 0}
                sx={[
                  (theme) => ({
                    fontWeight: 'fontWeightBold',
                    fontSize: { xs: 40, md: 64 },
                    lineHeight: { xs: 50 / 40, md: 80 / 64 },
                    fontFamily: theme.typography.fontSecondaryFamily,
                  }),
                ]}
              />
            </m.div>

            <m.div variants={varFade('inUp', { distance: 24 })}>
              <Box
                component="span"
                sx={[
                  (theme) => ({
                    ...theme.mixins.textGradient(
                      `90deg, ${theme.vars.palette.text.primary}, ${varAlpha(theme.vars.palette.text.primaryChannel, 0.2)}`
                    ),
                    opacity: 0.4,
                    typography: 'h6',
                  }),
                ]}
              >
                {item.label}
              </Box>
            </m.div>
          </Stack>
        ))}
      </Stack>

      {horizontalDivider('bottom')}
    </Stack>
  );

  return (
    <Box
      component="section"
      id="testimonials"
      sx={[{ py: 10, position: 'relative' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <MotionViewport>
        {renderLines()}

        <Container>
          {renderDescription()}
          {renderContent()}
          {renderNumber()}
        </Container>
      </MotionViewport>
    </Box>
  );
}

// ----------------------------------------------------------------------

const createReview = (index: number) => ({
  id: _mock.id(index),
  name: _mock.fullName(index),
  avatar: _mock.image.avatar(index),
  rating: 5,
});

const TESTIMONIALS = [
  {
    ...createReview(1),
    category: 'AI Assistance',
    content: `ChainLab's AI code generation saved me weeks of development time. The suggestions are incredibly accurate and security-focused.`,
    postedAt: 'April 20, 2024 23:15:30',
  },
  {
    ...createReview(2),
    category: 'Collaboration',
    content: `Real-time collaboration features let our remote team work together seamlessly. It's like Google Docs for smart contracts!`,
    postedAt: 'March 19, 2024 23:15:30',
  },
  {
    ...createReview(3),
    category: 'Deployment',
    content: `One-click deployment to multiple chains simplified our launch process dramatically. Testing on testnets is so intuitive now.`,
    postedAt: 'April 19, 2024 23:15:30',
  },
  {
    ...createReview(4),
    category: 'IDE Experience',
    content: `The browser-based IDE is incredibly responsive with all the features I need. No more switching between multiple tools.`,
    postedAt: 'May 10, 2024 23:15:30',
  },
  {
    ...createReview(5),
    category: 'Learning Curve',
    content: `As a traditional developer new to Web3, ChainLab made blockchain development accessible. The tutorials are excellent.`,
    postedAt: 'June 5, 2024 23:15:30',
  },
  {
    ...createReview(6),
    category: 'Business Tools',
    content: `The integrated analytics and governance tools helped our DAO launch faster than we thought possible. Highly recommended!`,
    postedAt: 'July 12, 2024 23:15:30',
  },
  {
    ...createReview(7),
    category: 'Testing Framework',
    content: `Automated test generation caught several critical vulnerabilities in our contract. The security analysis is worth the price alone.`,
    postedAt: 'August 3, 2024 23:15:30',
  },
  {
    ...createReview(8),
    category: 'Frontend Tools',
    content: `The component library and templates for frontend development saved us months of UI/UX work. Seamless backend integration.`,
    postedAt: 'September 8, 2024 23:15:30',
  },
];
