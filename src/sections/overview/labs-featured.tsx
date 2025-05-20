import type { BoxProps } from '@mui/material/Box';
import type { CardProps } from '@mui/material/Card';

import Autoplay from 'embla-carousel-autoplay';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { fToNow } from 'src/utils/format-time';

import { Image } from 'src/components/image';
import {
  Carousel,
  useCarousel,
  CarouselDotButtons,
  CarouselArrowBasicButtons,
} from 'src/components/carousel';

// ----------------------------------------------------------------------

interface NewsItemType {
  title: string;
  link: string;
  pubDate?: string;
  isoDate?: string;
  imageUrl?: string;
}

type Props = CardProps & {
  list: NewsItemType[];
  isLoading: boolean;
};

export function LabsFeatured({ list, isLoading, sx, ...other }: Props) {
  const carousel = useCarousel({ loop: true }, [Autoplay({ playOnInit: true, delay: 8000 })]);

  if (isLoading) {
    // Yüklenme durumunda Card'a minHeight ekleyerek layout shift'i önleyelim
    return (
      <Card sx={{ p: 3, minHeight: 280, ...sx }} {...other}>
        {/* Skeleton yüksekliğini kaldırabilir veya minHeight ile uyumlu tutabiliriz, şimdilik kaldıralım */}
        <Skeleton variant="rectangular" sx={{ height: '100%', minHeight: 200 }} />{' '}
        {/* Skeleton'a da esnek yükseklik verelim */}
      </Card>
    );
  }

  return (
    <Card sx={[{ bgcolor: 'common.black' }, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
      {
        isLoading && [...Array(3)].map((_, index) => <CarouselItemSkeleton key={index} />) // Yüklenirken 3 iskelet göster
      }
      {!isLoading && list.length === 0 && (
        <Typography sx={{ textAlign: 'center', p: 3 }}>No news available.</Typography> // Haber yoksa mesaj
      )}
      {!isLoading && (
        <>
          <CarouselDotButtons
            scrollSnaps={carousel.dots.scrollSnaps}
            selectedIndex={carousel.dots.selectedIndex}
            onClickDot={carousel.dots.onClickDot}
            sx={{
              top: 16,
              left: 16,
              position: 'absolute',
              color: 'primary.light',
            }}
          />

          <CarouselArrowBasicButtons
            {...carousel.arrows}
            options={carousel.options}
            sx={{
              top: 8,
              right: 8,
              position: 'absolute',
              color: 'common.white',
            }}
          />

          <Carousel carousel={carousel}>
            {list.map(
              (
                item: NewsItemType // item tipi eklendi
              ) => (
                <CarouselItem key={item.link} item={item} />
              )
            )}
          </Carousel>
        </>
      )}
    </Card>
  );
}

// ----------------------------------------------------------------------

type CarouselItemProps = BoxProps & {
  item: NewsItemType;
};

function CarouselItem({ item, sx, ...other }: CarouselItemProps) {
  return (
    <Box
      {...other}
      sx={[
        {
          width: 1,
          position: 'relative',
        },
        ...(Array.isArray(sx) ? sx : [sx]), // sx prop kullanımı düzeltildi
      ]}
    >
      <Box
        sx={{
          p: 3,
          gap: 1,
          width: 1,
          bottom: 0,
          zIndex: 9,
          display: 'flex',
          position: 'absolute',
          color: 'common.white',
          flexDirection: 'column',
        }}
      >
        {item.isoDate && (
          <Typography variant="overline" sx={{ opacity: 0.72 }}>
            {fToNow(item.isoDate)} ago
          </Typography>
        )}
        <Link
          component="a" // Link olarak davranması için
          href={item.link} // Haber linki
          target="_blank" // Yeni sekmede aç
          rel="noopener noreferrer" // Güvenlik için
          color="inherit"
          variant="h6"
          underline="hover"
          noWrap
        >
          {item.title} {/* Başlığı göster */}
        </Link>
      </Box>

      <Image
        alt={item.title}
        src={item.imageUrl || '/placeholder.svg'}
        slotProps={{
          overlay: {
            sx: (theme) => ({
              backgroundImage: `linear-gradient(to bottom, transparent 0%, ${theme.vars.palette.common.black} 75%)`,
            }),
          },
        }}
        sx={{ width: 1, height: { xs: 288, xl: 320 } }}
      />
    </Box>
  );
}

function CarouselItemSkeleton() {
  return (
    <Box
      sx={[
        {
          width: 1,
          position: 'relative',
        },
      ]}
    >
      <Skeleton
        variant="rectangular"
        width="100%"
        sx={{ height: { xs: 288, xl: 320 }, borderRadius: 1.5 }}
      />

      <Box
        sx={{
          p: 3,
          gap: 1,
          width: 1,
          bottom: 0,
          zIndex: 9,
          display: 'flex',
          position: 'absolute',
          color: 'common.white',
          flexDirection: 'column',
        }}
      >
        <Skeleton variant="text" sx={{ width: '40%', opacity: 0.48 }} />
        <Skeleton variant="text" sx={{ mt: 0.5, mb: 1, width: '80%' }} />
      </Box>
    </Box>
  );
}
