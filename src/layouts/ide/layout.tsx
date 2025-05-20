'use client';

import type { Breakpoint } from '@mui/material/styles';
import type { NavSectionProps } from 'src/components/nav-section';

import React from 'react';
import { merge } from 'es-toolkit';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import { useProjects } from 'src/hooks/projects/use-project-queries';
import { useCurrentProject } from 'src/hooks/projects/use-project-utils';

import { Logo } from 'src/components/logo';
import { useSettingsContext } from 'src/components/settings';

import { NavMobile } from './nav-mobile';
import { layoutClasses } from '../core/classes';
import { MainSection } from '../core/main-section';
import { MenuButton } from '../components/menu-button';
import { HeaderSection } from '../core/header-section';
import { LayoutSection } from '../core/layout-section';
import { navData as dashboardNavData } from '../nav-config-dashboard';
import { dashboardLayoutVars, dashboardNavColorVars } from './css-vars';

import type { MainSectionProps } from '../core/main-section';
import type { HeaderSectionProps } from '../core/header-section';
import type { LayoutSectionProps } from '../core/layout-section';

// IDE sabit değerleri
const ACTIVITY_BAR_WIDTH = 100;

type LayoutBaseProps = Pick<LayoutSectionProps, 'sx' | 'children' | 'cssVars'>;

export type IdeLayoutProps = LayoutBaseProps & {
  layoutQuery?: Breakpoint;
  slotProps?: {
    header?: HeaderSectionProps;
    nav?: {
      data?: NavSectionProps['data'];
    };
    main?: MainSectionProps;
  };
};

export function IdeLayout({
  sx,
  cssVars,
  children,
  slotProps,
  layoutQuery = 'lg',
}: IdeLayoutProps) {
  const theme = useTheme();

  const settings = useSettingsContext();

  const navVars = dashboardNavColorVars(theme, settings.state.navColor, settings.state.navLayout);

  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();

  const navData = slotProps?.nav?.data ?? dashboardNavData;

  const isNavMini = settings.state.navLayout === 'mini';

  const renderHeader = () => {
    const headerHeight = {
      xs: 'calc(var(--layout-header-mobile-height) - 6px)',
      [layoutQuery]: 'calc(var(--layout-header-desktop-height))',
    };

    const headerSlotProps: HeaderSectionProps['slotProps'] = {
      container: {
        maxWidth: false,
        sx: {
          display: 'flex',
          flexDirection: 'column',
          height: headerHeight,
          px: 0,
          py: 0,
          mb: 0,
          '& .MuiContainer-root': {
            p: 0,
            m: 0,
          },
        },
      },
    };

    const renderLogoArea = (
      <Box
        sx={{
          width: ACTIVITY_BAR_WIDTH,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'left',
          pl: 1,
          borderColor: 'divider',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            right: 0,
            height: '100%%',
            width: 1,
          },
        }}
      >
        <Logo
          sx={{
            width: 20,
            height: 20,
            filter:
              theme.palette.mode === 'dark' ? 'drop-shadow(0 0 2px rgba(255,255,255,0.2))' : 'none',
          }}
        />
      </Box>
    );

    const renderControlArea = (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0.5, sm: 0.5 },
          pr: 2,
          height: '100%',
        }}
      >
        <MenuButton
          onClick={onOpen}
          sx={{
            display: { xs: 'flex', [layoutQuery]: 'none' },
            color: 'text.secondary',
          }}
        />
        <NavMobile data={navData} open={open} onClose={onClose} cssVars={navVars.section} />
      </Box>
    );

    const renderTopBar = (
      <Box
        sx={{
          height: headerHeight,
          display: 'flex',
          width: '100%',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: (t) =>
            t.palette.mode === 'dark' ? 'none' : `0 1px 2px 0 ${alpha(t.palette.grey[500], 0.08)}`,
        }}
      >
        {renderLogoArea}

        <Box
          sx={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            height: '100%',
            justifyContent: 'space-between',
            px: { xs: 1, md: 2 },
          }}
        >
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ProjectTitle />
          </Box>

          {renderControlArea}
        </Box>
      </Box>
    );

    return (
      <HeaderSection
        layoutQuery={layoutQuery}
        disableOffset
        disableElevation
        {...slotProps?.header}
        slots={{
          topArea: renderTopBar,
          ...slotProps?.header?.slots,
        }}
        slotProps={merge(headerSlotProps, slotProps?.header?.slotProps ?? {})}
        sx={{
          ...(slotProps?.header?.sx ?? {}),
          boxShadow: 'none',
          position: 'relative',
          zIndex: theme.zIndex.appBar,
          '& .MuiContainer-root': {
            display: 'none',
          },
          mb: '-1px',
           backgroundColor: '#141A21'
        }}
      />
    );
  };

  // Component to display the project title
  const ProjectTitle = () => {
    const { projectId } = useCurrentProject();
    const { projects, projectsLoading } = useProjects();

    // Find the current project
    const currentProject = projectId && projects ? projects.find((p) => p.id === projectId) : null;

    if (projectsLoading) {
      return (
        <Typography fontSize={13} sx={{ fontWeight: 'bold' }}>
          Loading Project...
        </Typography>
      );
    }

    return (
      <Typography fontSize={13} sx={{ fontWeight: 'bold' }}>
        {currentProject ? currentProject.name : 'No Project Selected'}
      </Typography>
    );
  };

  const renderFooter = () => null;

  const renderMain = () => <MainSection {...slotProps?.main}>{children}</MainSection>;

  return (
    <LayoutSection
      /** **************************************
       * @Header
       *************************************** */
      headerSection={renderHeader()}
      /** **************************************
       * @Footer
       *************************************** */
      footerSection={renderFooter()}
      /** **************************************
       * @Styles
       *************************************** */
      cssVars={{ ...dashboardLayoutVars(theme), ...navVars.layout, ...cssVars }}
      sx={[
        {
          [`& .${layoutClasses.sidebarContainer}`]: {
            [theme.breakpoints.up(layoutQuery)]: {
              pl: isNavMini ? 'var(--layout-nav-mini-width)' : 'var(--layout-nav-vertical-width)',
              transition: theme.transitions.create(['padding-left'], {
                easing: 'var(--layout-transition-easing)',
                duration: 'var(--layout-transition-duration)',
              }),
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {renderMain()}
    </LayoutSection>
  );
}
