import type { SettingsState } from 'src/components/settings/types';

import { useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import { useColorScheme, alpha, useTheme } from '@mui/material/styles';

import { themeConfig } from 'src/theme/theme-config';
import { primaryColorPresets } from 'src/theme/with-settings';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { BaseOption } from 'src/components/settings/drawer/base-option';
import { SmallBlock, LargeBlock } from 'src/components/settings/drawer/styles';
import { PresetsOptions } from 'src/components/settings/drawer/presets-options';
import { useSettingsContext } from 'src/components/settings/context/use-settings-context';
import { FontSizeOptions, FontFamilyOptions } from 'src/components/settings/drawer/font-options';

// ----------------------------------------------------------------------

export default function IdeSettingsPanel() {
  const settings = useSettingsContext();
  const { mode, setMode, systemMode } = useColorScheme();
  const theme = useTheme();

  useEffect(() => {
    if (mode === 'system' && systemMode) {
      settings.setState({ colorScheme: systemMode });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, systemMode]);

  // Hard-code default values since we don't have defaultSettings in the context
  const defaultSettings = {
    primaryColor: 'default' as SettingsState['primaryColor'],
    fontFamily: themeConfig.fontFamily.primary,
    fontSize: 16,
  };

  // Visible options check
  const isFontFamilyVisible = true;
  const isCompactLayoutVisible = true;
  const isDirectionVisible = true;
  const isColorSchemeVisible = true;
  const isContrastVisible = true;

  const isPrimaryColorVisible = true;
  const isFontSizeVisible = true;

  const handleReset = useCallback(() => {
    // Only reset the settings to defaults
    settings.onReset();

    setMode('dark');
  }, [settings, setMode]);

  const renderMode = () => (
    <BaseOption
      label="Dark mode"
      icon="moon"
      selected={settings.state.colorScheme === 'dark'}
      onChangeOption={() => {
        setMode(mode === 'light' ? 'dark' : 'light');
        settings.setState({ colorScheme: mode === 'light' ? 'dark' : 'light' });
      }}
    />
  );

  const renderContrast = () => (
    <BaseOption
      label="Contrast"
      icon="contrast"
      selected={settings.state.contrast === 'hight'}
      onChangeOption={() =>
        settings.setState({
          contrast: settings.state.contrast === 'default' ? 'hight' : 'default',
        })
      }
    />
  );

  const renderRtl = () => (
    <BaseOption
      label="Right to left"
      icon="align-right"
      selected={settings.state.direction === 'rtl'}
      onChangeOption={() =>
        settings.setState({
          direction: settings.state.direction === 'ltr' ? 'rtl' : 'ltr',
        })
      }
    />
  );

  const renderCompact = () => (
    <BaseOption
      tooltip="Dashboard only and available at large resolutions > 1600px (xl)"
      label="Compact"
      icon="autofit-width"
      selected={!!settings.state.compactLayout}
      onChangeOption={() => settings.setState({ compactLayout: !settings.state.compactLayout })}
    />
  );

  const renderPresets = () => (
    <LargeBlock
      title="Presets"
      canReset={settings.state.primaryColor !== defaultSettings.primaryColor}
      onReset={() => settings.setState({ primaryColor: defaultSettings.primaryColor })}
    >
      <PresetsOptions
        icon={<></>}
        options={
          Object.keys(primaryColorPresets).map((key) => ({
            name: key,
            value: primaryColorPresets[key].main,
          })) as { name: SettingsState['primaryColor']; value: string }[]
        }
        value={settings.state.primaryColor}
        onChangeOption={(newOption) => settings.setState({ primaryColor: newOption })}
      />
    </LargeBlock>
  );

  const renderFont = () => (
    <LargeBlock title="Font" sx={{ gap: 2.5 }}>
      {isFontFamilyVisible && (
        <SmallBlock
          label="Family"
          canReset={settings.state.fontFamily !== defaultSettings.fontFamily}
          onReset={() => settings.setState({ fontFamily: defaultSettings.fontFamily })}
        >
          <FontFamilyOptions
            icon={<></>}
            options={[
              themeConfig.fontFamily.primary,
              'Inter Variable',
              'DM Sans Variable',
              'Nunito Sans Variable',
            ]}
            value={settings.state.fontFamily}
            onChangeOption={(newOption) => settings.setState({ fontFamily: newOption })}
          />
        </SmallBlock>
      )}
      {isFontSizeVisible && (
        <SmallBlock
          label="Size"
          canReset={settings.state.fontSize !== defaultSettings.fontSize}
          onReset={() => settings.setState({ fontSize: defaultSettings.fontSize })}
          sx={{ gap: 5 }}
        >
          <FontSizeOptions
            options={[12, 20]}
            value={settings.state.fontSize}
            onChangeOption={(newOption) => settings.setState({ fontSize: newOption })}
          />
        </SmallBlock>
      )}
    </LargeBlock>
  );

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        maxWidth: '100%',
      }}
    >
      {/* Modern Header with Gradient */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          py: 2,
          px: { xs: 2, md: 4 },
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          backdropFilter: 'blur(10px)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(139, 69, 255, 0.05) 0%, rgba(59, 130, 246, 0.03) 100%)'
                : 'linear-gradient(135deg, rgba(139, 69, 255, 0.03) 0%, rgba(59, 130, 246, 0.02) 100%)',
            zIndex: -1,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              width: 42,
              height: 42,
              boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <Iconify icon="mdi:cog-outline" width={24} />
          </Avatar>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: -0.5,
                mb: 0.2,
                fontSize: '1.3rem',
              }}
            >
              General Settings
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: '0.85rem',
              }}
            >
              Customize your platform settings
            </Typography>
          </Box>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Reset all settings" arrow>
            <IconButton
              onClick={handleReset}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.error.main, 0.1),
                color: 'error.main',
                '&:hover': {
                  bgcolor: alpha(theme.palette.error.main, 0.2),
                  transform: 'scale(1.1)',
                },
              }}
            >
              <Badge color="error" variant="dot" invisible={!settings.canReset}>
                <Iconify icon="solar:restart-bold" width={18} />
              </Badge>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Scrollbar sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            px: 10,
            py: 5,
            gap: 6,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              gap: 2,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
            }}
          >
            {isColorSchemeVisible && renderMode()}
            {isContrastVisible && renderContrast()}
            {isDirectionVisible && renderRtl()}
            {isCompactLayoutVisible && renderCompact()}
          </Box>

          {isPrimaryColorVisible && renderPresets()}
          {(isFontFamilyVisible || isFontSizeVisible) && renderFont()}
        </Box>
      </Scrollbar>
    </Box>
  );
}
