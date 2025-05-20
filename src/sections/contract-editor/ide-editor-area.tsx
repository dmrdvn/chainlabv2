import type { ProjectFile } from "src/types/project";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import { toast } from "sonner";
import { Icon } from "@iconify/react";
import React, { useRef, useState, useEffect, useCallback } from "react";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useTheme } from "@mui/material/styles";
import { CircularProgress } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

import { useProjectFileContent } from "src/hooks/projects/use-project-files-queries";
import { useUpdateProjectFileContent } from "src/hooks/projects/use-project-mutations";

import { getFileIconElement } from "src/utils/file-icons.utils";

import { MonacoEditor } from "src/components/monaco-editor";
import { getLanguageFromPath } from "src/components/monaco-editor/config";

import IdeWelcome from "./ide-welcome";
import IdeSettingsPanel from "./ide-settings-panel";

// Special file ID for settings panel
export const SETTINGS_FILE_ID = "settings:general";

// Create a virtual file for the settings panel
export const createSettingsFile = (): ProjectFile => ({
  id: SETTINGS_FILE_ID,
  project_id: "",
  project_version_id: "",
  parent_id: null,
  file_name: "settings.json",
  file_path: "settings.json",
  is_directory: false,
  content: null,
  mime_type: "application/json",
  created_at: "",
  updated_at: "",
});

interface CursorPosition {
  lineNumber: number;
  column: number;
}

interface IdeEditorAreaProps {
  openFiles: ProjectFile[];
  activeFileId: string | null;
  onTabChange: (event: React.SyntheticEvent, newValue: string | null) => void;
  onCloseTab: (fileIdToClose: string) => void;
  onCursorPositionChange?: (position: CursorPosition) => void;
}

export default function IdeEditorArea({
  openFiles,
  activeFileId,
  onTabChange,
  onCloseTab,
  onCursorPositionChange,
}: IdeEditorAreaProps) {
  const theme = useTheme();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const {
    file: activeFileData,
    fileLoading: isContentLoadingActual,
    fileError: contentErrorActual,
  } = useProjectFileContent(activeFileId);

  const activeFile = openFiles.find((f) => f.id === activeFileId);

  /* console.log('--IdeEditorArea Props: openFiles:', JSON.stringify(openFiles, null, 2), 'activeFileId:', activeFileId);
  console.log('--IdeEditorArea: activeFile found:', JSON.stringify(activeFile, null, 2));
   */

  // Dosya kaydetme hook'u ve yükleme durumu
  const { handleUpdateFile, isLoading: isSaving } =
    useUpdateProjectFileContent();

  // Yerel olarak kaydedilmiş içerikleri dosya ID'sine göre takip etmek için state
  const [localContents, setLocalContents] = useState<Record<string, string>>(
    {},
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<
    Record<string, boolean>
  >({});

  const displayedContent =
    localContents[activeFileId ?? ""] ?? activeFileData?.content ?? "";

  const handleContentChange = (value: string | undefined) => {
    if (activeFileId && value !== undefined) {
      setLocalContents((prev) => ({ ...prev, [activeFileId]: value }));
      setHasUnsavedChanges((prev) => ({ ...prev, [activeFileId]: true }));
    }
  };

  const handleSave = useCallback(async () => {
    if (!activeFile || activeFile.id === SETTINGS_FILE_ID) {
      return;
    }

    if (!hasUnsavedChanges[activeFile.id]) {
      return;
    }

    const contentToSave = localContents[activeFile.id];
    if (contentToSave === undefined) {
      return;
    }

    try {
      const result = await handleUpdateFile({
        fileId: activeFile.id,
        newContent: contentToSave,
      });

      if (result.success) {
        toast.success(`${activeFile.file_name} saved successfully!`);
        setHasUnsavedChanges((prev) => ({ ...prev, [activeFile.id]: false }));
      } else {
        toast.error(result.message || `Error saving ${activeFile.file_name}`);
      }
    } catch (err: any) {
      console.error("Error during handleSave:", err);
      toast.error(
        err.message ||
          `An unexpected error occurred while saving ${activeFile.file_name}`,
      );
    }
  }, [activeFile, localContents, handleUpdateFile, hasUnsavedChanges]);

  useEffect(() => {
    if (
      activeFileId &&
      activeFileId !== SETTINGS_FILE_ID &&
      editorRef.current
    ) {
      // Ensure content is loaded before setting up listeners or focusing
      if (!isContentLoadingActual && activeFileData) {
        const editorModel = editorRef.current.getModel();
        const currentEditorContent = editorRef.current.getValue();
        const newContent =
          localContents[activeFileId] ?? activeFileData.content ?? "";

        if (editorModel && currentEditorContent !== newContent) {
          editorRef.current.setValue(newContent);
        }
        // Focus and restore state only after content is set
        editorRef.current.focus();
      }
    }
  }, [activeFileId, isContentLoadingActual, activeFileData, localContents]);

  // === Erken Çıkışlar ===
  if (!activeFileId) {
    return <IdeWelcome />;
  }

  // İçerik yükleme ve hata durumları
  if (isContentLoadingActual) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <CircularProgress size={24} />
        <Typography sx={{ ml: 2 }}>Loading file content...</Typography>
      </Box>
    );
  }

  if (contentErrorActual) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="subtitle1" color="error">
          Error loading file:
        </Typography>
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {contentErrorActual.message || "An unknown error occurred."}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        minHeight: 0,
      }}
    >
      {openFiles.length > 0 && (
        <Box sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
          {" "}
          {/* Tabs */}
          <Tabs
            value={activeFileId || false}
            onChange={onTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="Open file tabs"
            sx={{
              minHeight: "40px",
              paddingLeft: 0,
              "& .MuiTabs-indicator": {
                backgroundColor: "primary.main",
              },
              "& .MuiTabs-flexContainer": {
                gap: 0,
              },
            }}
          >
            {openFiles.map((file) => {
              const fileName =
                file.id === SETTINGS_FILE_ID
                  ? "Settings"
                  : file.file_path.split("/").pop() || file.file_path; // Use full path as fallback

              return (
                <Tab
                  key={file.id}
                  value={file.id}
                  label={
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        px: 0,
                        py: 0.5,
                      }}
                    >
                      {/* Show cog icon for settings tab, otherwise normal file icon */}
                      {file.id === SETTINGS_FILE_ID ? (
                        <Icon
                          icon="mdi:cog-outline"
                          width={16}
                          height={16}
                          style={{ marginRight: 6 }}
                        />
                      ) : (
                        getFileIconElement(file.file_path, {
                          sx: { width: 16, height: 16, mr: 0.75 },
                        })
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          textTransform: "none",
                          mr: 1,
                          color:
                            activeFileId === file.id
                              ? "text.primary"
                              : "text.secondary",
                        }}
                      >
                        {hasUnsavedChanges[file.id]
                          ? `${fileName} *`
                          : fileName}
                      </Typography>
                      <IconButton
                        component="div"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasUnsavedChanges[file.id]) {
                            toast.warning(
                              `Please save changes in ${fileName} before closing.`,
                            );
                          } else {
                            onCloseTab(file.id);
                          }
                        }}
                        sx={{
                          ml: "auto",
                          p: 0.25,
                          opacity: 0.7,
                          "&:hover": { opacity: 1, bgcolor: "action.hover" },
                          color: "inherit",
                        }}
                      >
                        <Icon icon="eva:close-outline" width={16} height={16} />
                      </IconButton>
                    </Box>
                  }
                  sx={{
                    minHeight: "40px",
                    p: "0px 6px 0px 12px",
                    borderRight: 1,
                    borderColor: "divider",
                    opacity: 1,
                    bgcolor:
                      activeFileId === file.id
                        ? theme.palette.action.selected
                        : "transparent",
                    "&:hover": {
                      bgcolor:
                        activeFileId !== file.id
                          ? theme.palette.action.hover
                          : undefined,
                    },
                  }}
                />
              );
            })}
          </Tabs>
        </Box>
      )}

      {/* Ana İçerik Alanı */}
      <Box
        sx={{
          flexGrow: 1,
          position: "relative",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {isSaving && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              p: 1,
              backgroundColor: "action.hover",
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Saving...
            </Typography>
          </Box>
        )}
        {/* Ayarlar paneli mi yoksa editör mü gösterilecek? */}
        {activeFileId === SETTINGS_FILE_ID ? (
          <IdeSettingsPanel />
        ) : (
          // Aktif dosya bir ayar dosyası değilse Monaco Editor'ı render et
          <MonacoEditor
            key={activeFile?.id} // Dosya değiştiğinde editor'ü yeniden oluştur
            height="100%" // Restore height prop
            language={getLanguageFromPath(activeFile?.file_path || "")}
            value={displayedContent} // Yerel değişiklikleri de içeren içeriği göster
            onChange={handleContentChange} // İçerik değiştikçe yerel state'i güncelle
            onSave={handleSave} // Kaydetme eylemini tetikle
            onCursorPositionChange={onCursorPositionChange} // İmleç pozisyonunu üst bileşene ilet
          />
        )}
      </Box>
    </Box>
  );
}
