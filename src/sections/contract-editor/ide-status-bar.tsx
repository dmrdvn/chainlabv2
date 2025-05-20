import React, { useState } from "react";

import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Divider from "@mui/material/Divider";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";

import { Iconify } from "src/components/iconify";

/**
 * IDE Status Bar component props
 */
interface IdeStatusBarProps {
  // Basic status information
  lineNumber: number;
  columnNumber: number;
  projectName: string;
  activeFileName: string | null;

  // Event handlers
  onTogglePanel: () => void;
  onToggleChat: () => void;
  onActiveFileChange: (fileId: string | null) => void;
}

/**
 * IDE Status Bar Component
 *
 * Displays information about current file, cursor position, and provides actions
 */
export default function IdeStatusBar({
  // Basic status information
  lineNumber,
  columnNumber,
  projectName,
  activeFileName,

  // Event handlers
  onTogglePanel,
  onToggleChat,
}: IdeStatusBarProps) {
  // Local state for menu/UI management
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.secondary,
        zIndex: theme.zIndex.appBar + 1,
      }}
    >
      <Toolbar
        variant="dense"
        sx={{
          minHeight: 30,
          px: { xs: 1, md: 2 },
          justifyContent: "space-between",
        }}
      >
        {/* Left Side: Project Name, Terminal Button, Active File */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {/* Terminal Toggle Button - Moved to left */}
          <Button
            size="small"
            variant="text" // Use text variant for subtle look
            color="inherit" // Inherit color from toolbar
            startIcon={<Iconify icon="codicon:terminal" width={14} />} // Slightly smaller icon
            onClick={onTogglePanel}
            sx={{ textTransform: "none", px: 1, minWidth: "auto" }} // Remove default minWidth if needed
          >
            <Typography variant="caption">Terminal</Typography>{" "}
            {/* Use caption variant */}
          </Button>

          {/* Divider after Terminal button */}
          <Divider orientation="vertical" flexItem sx={{ ml: 1, mr: 1 }} />

          {/* Project Name */}
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {projectName}
          </Typography>
          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: "none", md: "block" } }}
          />

          {activeFileName && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Iconify
                icon="vscode-icons:file-type-solidity"
                width={16}
                sx={{ color: "warning.main" }}
              />
              <Typography
                variant="caption"
                sx={{ px: 0.5, borderRadius: 1, py: 0.25 }}
              >
                {activeFileName} {/* Artık dışarıdan gelen ismi kullanıyoruz */}
              </Typography>
            </Stack>
          )}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1.5}>
          {/* Line & Column Info */}
          <Stack direction="row" spacing={1} sx={{ mr: 2 }}>
            <Typography variant="caption">
              Ln {lineNumber}, Col {columnNumber}
            </Typography>
          </Stack>

          {/* Optional: Add other status indicators like notifications or chat toggle here */}
          {/* Example: Chat Toggle Button */}
          <IconButton size="small" onClick={onToggleChat} sx={{ p: 0.25 }}>
            <Iconify icon="fluent:chat-20-filled" width={16} />
          </IconButton>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
