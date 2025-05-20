import type { SxProps } from '@mui/material/styles';
import type { Project, ProjectOwner } from 'src/types/project';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { fDateTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { Markdown } from 'src/components/markdown';

// ----------------------------------------------------------------------

type Props = {
  project?: Project;
  owner?: ProjectOwner | null;
  ownerLoading?: boolean;
  sx?: SxProps;
};

export function ProjectsDetailsContent({ project, owner, ownerLoading, sx, ...other }: Props) {
  const renderContent = () => (
    <Card
      sx={{
        p: 3,
        gap: 3,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h4">{project?.name}</Typography>

      <Markdown children={project?.description || ''} />

      <Stack spacing={2}>
        <Typography variant="h6">Tags</Typography>
        <Box sx={{ gap: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          {project?.tags &&
            project.tags.map((tag) => <Chip key={tag} label={tag} variant="soft" />)}
        </Box>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h6">Social Links</Typography>
        <Box sx={{ gap: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          {project?.social_links && Object.values(project.social_links).some((url) => url) ? (
            Object.entries(project.social_links)
              .filter(([, url]) => url)
              .map(([platform, url]) => {
                let icon = '';
                switch (platform.toLowerCase()) {
                  case 'github':
                    icon = 'mdi:github';
                    break;
                  case 'twitter':
                  case 'x':
                    icon = 'mdi:twitter';
                    break;
                  case 'linkedin':
                    icon = 'mdi:linkedin';
                    break;
                  case 'discord':
                    icon = 'mdi:discord';
                    break;
                  case 'website':
                    icon = 'mdi:web';
                    break;
                  default:
                    icon = 'mdi:link-variant';
                }

                return (
                  <Chip
                    key={platform}
                    label={platform}
                    icon={<Iconify icon={icon} />}
                    component="a"
                    href={url?.toString() || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    clickable
                    variant="soft"
                  />
                );
              })
          ) : (
            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              No social links added for this project.
            </Typography>
          )}
        </Box>
      </Stack>
    </Card>
  );

  const renderOverview = () => (
    <Card sx={{ mb: 3 }}>
      <Stack sx={{ p: 2 }} alignItems="center">
        <Avatar
          alt={project?.name || 'P'}
          src={project?.logo_url ? project.logo_url : '/assets/images/avatar/avatar_25.jpg'}
          variant="rounded"
          sx={{
            width: '100%',
            height: 'auto',
            maxHeight: 300,
            fontSize: '8rem',
            fontWeight: 100,
            objectFit: 'contain',
            ...(!project?.logo_url && { py: 50 }),
          }}
        />
      </Stack>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Stack spacing={2} sx={{ p: 3 }}>
        {[
          {
            label: 'Created date',
            value: fDateTime(project?.created_at),
            icon: <Iconify icon="solar:calendar-date-bold" width={30} />,
          },
          {
            label: 'Last updated',
            value: fDateTime(project?.updated_at),
            icon: <Iconify icon="solar:calendar-date-bold" width={30} />,
          },
          {
            label: 'Visibility',
            value: project?.visibility || 'private',
            icon: <Iconify icon="ic:round-visibility" width={30} />,
          },
          {
            label: 'Platform',
            value: project?.platform?.toUpperCase() || 'N/A',
            icon: <Iconify icon="carbon:blockchain" width={30} />,
          },
        ].map((item) => (
          <Stack key={item.label} spacing={1.5} direction="row" alignItems="center">
            {item.icon}
            <ListItemText
              primary={item.label}
              secondary={item.value}
              primaryTypographyProps={{ variant: 'body1', color: 'text.secondary' }}
              secondaryTypographyProps={{
                component: 'span',
                variant: 'subtitle1',
                color: 'text.primary',
              }}
            />
          </Stack>
        ))}
      </Stack>
    </Card>
  );

  const renderOwner = () => {
    if (ownerLoading) {
      return (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            mt: 3,
            gap: 2,
            borderRadius: 2,
            display: 'flex',
          }}
        >
          <Skeleton variant="rounded" width={64} height={64} />
          <Skeleton variant="text" width="60%" height={24} sx={{ ml: 2 }} />
        </Paper>
      );
    }

    return (
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          mt: 3,
          gap: 2,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Avatar
          alt={owner?.fullname || 'Owner'}
          src={owner?.avatar_url || ''}
          variant="rounded"
          sx={{ width: 64, height: 64 }}
        />

        <Stack spacing={0.5} sx={{ ml: 2 }}>
          <Typography variant="h6">Project Owner</Typography>
          <Typography variant="subtitle2">{owner?.fullname || 'Anonymous'}</Typography>
        </Stack>
      </Paper>
    );
  };

  return (
    <Box sx={sx}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>{renderContent()}</Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          {renderOverview()}
          {renderOwner()}
        </Grid>
      </Grid>
    </Box>
  );
}
