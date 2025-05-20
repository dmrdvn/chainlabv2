import React from "react";

import { Box, Stack, alpha, styled, Tooltip, IconButton } from "@mui/material";

import { Iconify } from "src/components/iconify";

// ----------------------------------------------------------------------

const ACTIVITY_BAR_WIDTH = 40;

const ICONS = {
  explorer: "mdi:file-document-multiple-outline",
  search: "mdi:magnify",
  source_control: "mdi:source-branch",
  debug: "mdi:bug-outline",
  compiler: "mdi:play-circle-outline",
  deploy: "mdi:cloud-upload-outline",
};

/* Activity Bar Styles */
const StyledRoot = styled(Box)(({ theme }) => ({
  width: ACTIVITY_BAR_WIDTH,
  height: "100%",
  display: "flex",
  flexDirection: "column",
  backgroundColor:
    theme.palette.mode === "dark"
      ? alpha(theme.palette.background.neutral, 0.9) // Slightly different background
      : alpha(theme.palette.grey[200], 0.9),
  borderRight: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(0.5, 0),
  boxSizing: "border-box",
}));

/* Activity Bar Icon Button Styles */
const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "isActive",
})<{ isActive?: boolean }>(({ theme, isActive }) => ({
  width: ACTIVITY_BAR_WIDTH - 8, // Adjust for padding
  height: ACTIVITY_BAR_WIDTH - 8, // Adjust for padding
  margin: theme.spacing(0.5, "auto"),
  borderRadius: theme.shape.borderRadius * 0.75,
  color:
    theme.palette.mode === "dark"
      ? theme.palette.grey[500]
      : theme.palette.grey[700],
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    left: 0,
    top: "20%",
    bottom: "20%",
    width: 3,
    borderRadius: "0 3px 3px 0",
    backgroundColor: theme.palette.primary.main,
    transform: isActive ? "scaleY(1)" : "scaleY(0)",
    transition: theme.transitions.create("transform", {
      duration: theme.transitions.duration.short,
    }),
  },
  "&:hover": {
    color:
      theme.palette.mode === "dark"
        ? theme.palette.grey[300]
        : theme.palette.grey[900],
    backgroundColor:
      theme.palette.mode === "dark"
        ? alpha(theme.palette.grey[500], 0.16)
        : alpha(theme.palette.grey[500], 0.16),
  },
  ...(isActive && {
    color:
      theme.palette.mode === "dark"
        ? theme.palette.primary.light
        : theme.palette.primary.main,
    backgroundColor:
      theme.palette.mode === "dark"
        ? alpha(theme.palette.primary.main, 0.16)
        : alpha(theme.palette.primary.main, 0.08),
  }),
}));

// ----------------------------------------------------------------------

type ActivityBarProps = {
  activeView: string;
  onChangeView: (view: string) => void;
};

export function ActivityBar({ activeView, onChangeView }: ActivityBarProps) {
  const renderIcon = (id: string, icon: string, tooltip: string) => (
    <Tooltip title={tooltip} placement="right" arrow key={id}>
      <StyledIconButton
        isActive={activeView === id}
        onClick={() => onChangeView(id)}
      >
        <Iconify icon={icon} width={22} />
      </StyledIconButton>
    </Tooltip>
  );

  return (
    <StyledRoot>
      <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
        {Object.entries(ICONS).map(([key, icon]) =>
          renderIcon(
            key,
            icon,
            key.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()), // Format tooltip text
          ),
        )}
      </Stack>

      {/* Bottom Icons (e.g., settings, account) can be added later */}
      <Stack spacing={0.5}>
        {renderIcon("extensions", "mdi:puzzle-outline", "Extensions")}
      </Stack>
      <Stack spacing={0.5}>
        {renderIcon("settings", "mdi:cog-outline", "Settings")}
      </Stack>
    </StyledRoot>
  );
}
