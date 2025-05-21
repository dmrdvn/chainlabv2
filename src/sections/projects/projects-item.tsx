import type { Project } from 'src/types/project';
import type { CardProps } from '@mui/material/Card';

import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

// HTML etiketlerini temizleyen yardımcı fonksiyon
function stripHtmlTags(html: string | null): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}

import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = CardProps & {
  project: Project;
  editHref: string;
  detailsHref: string;
  onDelete: () => void;
};

export function ProjectsItem({ project, editHref, detailsHref, onDelete, sx, ...other }: Props) {
  const menuActions = usePopover();

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <li>
          <MenuItem component={RouterLink} href={detailsHref} onClick={() => menuActions.onClose()}>
            <Iconify icon="solar:eye-bold" />
            View
          </MenuItem>
        </li>

        <li>
          <MenuItem component={RouterLink} href={editHref} onClick={() => menuActions.onClose()}>
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>
        </li>

        <MenuItem
          onClick={() => {
            menuActions.onClose();
            onDelete();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  return (
    <>
      <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', ...sx }} {...other}>
        <IconButton onClick={menuActions.onOpen} sx={{ position: 'absolute', top: 8, right: 8 }}>
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>

        <Box sx={{ p: 3, pb: 2, flexGrow: 1 }}>
          {/* Logo ve proje ismi yan yana */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              alt={project.name}
              src={project.logo_url || ''}
              variant="rounded"
              sx={{ width: 48, height: 48, mr: 2 }}
            />

            <Box sx={{ flexGrow: 1 }}>
              <Link
                component={RouterLink}
                href={detailsHref}
                color="inherit"
                sx={{ typography: 'subtitle1', fontWeight: 'fontWeightMedium', display: 'block' }}
              >
                {project.name}
              </Link>
              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}
              >
                Created date: {fDate(project.created_at)}
              </Typography>
            </Box>
          </Box>

          {/* Proje Açıklaması */}
          {project.description && (
            <Typography
              variant="body2"
              sx={{
                mb: 1.5,
                color: 'text.secondary',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                height: 40,
              }}
            >
              {stripHtmlTags(project.description)}
            </Typography>
          )}

          {/* Etiketler */}
          {project.tags && project.tags.length > 0 && (
            <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
              <Typography
                variant="caption"
                sx={{ mr: 1, fontWeight: 600, color: 'text.secondary' }}
              >
                Tags:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, flexGrow: 1 }}>
                {project.tags.slice(0, 3).map((tag) => (
                  <Box
                    key={tag}
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      typography: 'caption',
                      bgcolor: 'background.neutral',
                      color: 'text.secondary',
                    }}
                  >
                    {tag}
                  </Box>
                ))}
                {project.tags.length > 3 && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    +{project.tags.length - 3} more
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Sosyal Linkler */}
          {project.social_links && Object.keys(project.social_links).length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography
                variant="caption"
                sx={{ mr: 1, fontWeight: 600, color: 'text.secondary' }}
              >
                Social:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {Object.entries(project.social_links).map(([platform, url]) => {
                  // Platforma göre ikon seçme
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
                    url && (
                      <IconButton
                        key={platform}
                        size="small"
                        component="a"
                        href={url.toString()}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: 'text.secondary',
                          '&:hover': { color: 'primary.main' },
                        }}
                      >
                        <Iconify icon={icon} width={20} />
                      </IconButton>
                    )
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>

        <Divider sx={{ borderStyle: 'dashed', mt: 'auto' }} />

        <Box
          sx={{
            p: 3,
            height: 60, // Sabit yükseklik
            rowGap: 1.5,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            alignItems: 'center',
          }}
        >
          {[
            {
              label: project.visibility || 'private',
              icon: <Iconify width={16} icon="solar:eye-bold" sx={{ flexShrink: 0 }} />,
            },
            {
              label: `Updated: ${fDate(project.updated_at)}`,
              icon: <Iconify width={16} icon="solar:clock-circle-bold" sx={{ flexShrink: 0 }} />,
            },
          ].map((item) => (
            <Box
              key={item.label}
              sx={{
                gap: 0.5,
                minWidth: 0,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                color: 'text.disabled',
              }}
            >
              {item.icon}
              <Typography variant="caption" noWrap>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Card>

      {renderMenuActions()}
    </>
  );
}
