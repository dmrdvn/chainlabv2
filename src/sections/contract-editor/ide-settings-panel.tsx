import type { SettingsState } from 'src/components/settings/types';

import { useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';

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
      <Box
        sx={{
          py: 1.5,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          width: '100%',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.palette.grey[800]
              : theme.palette.background.neutral,
          height: 50,
          boxShadow: (theme) =>
            `0 1px 2px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)'}`,
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            flexGrow: 1,
            fontWeight: 600,
            letterSpacing: 0.2,
            color: (theme) =>
              theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.grey[800],
          }}
        >
          General Settings
        </Typography>

        <Tooltip title="Reset all">
          <IconButton
            onClick={handleReset}
            size="small"
            sx={{
              color: (theme) =>
                theme.palette.mode === 'dark' ? theme.palette.grey[400] : theme.palette.grey[600],
              '&:hover': {
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              },
            }}
          >
            <Badge color="error" variant="dot" invisible={!settings.canReset}>
              <Iconify icon="solar:restart-bold" width={20} height={20} />
            </Badge>
          </IconButton>
        </Tooltip>
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
