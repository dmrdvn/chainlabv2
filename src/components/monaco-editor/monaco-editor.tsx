import type { EditorProps } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { registerLanguages } from './languages';
import { getEditorTheme, defineMonacoThemes } from './theme';
import {
  DEFAULT_EDITOR_OPTIONS,
  READ_ONLY_EDITOR_OPTIONS,
  getLanguageSpecificOptions,
} from './config/editor-options';

// ----------------------------------------------------------------------
declare global {
  interface Window {
    monaco: typeof monaco;
  }
}

export interface MonacoEditorProps extends EditorProps {
  /**
   * The content to display in the editor
   */
  value?: string;

  /**
   * The language to use for syntax highlighting
   * @default 'javascript'
   */
  language?: string;

  /**
   * Editor height
   * @default '100%'
   */
  height?: string | number;

  /**
   * Whether the editor is read-only
   * @default false
   */
  readOnly?: boolean;

  /**
   * Callback when the editor content changes
   */
  onChange?: (value: string | undefined) => void;

  /**
   * Callback when the cursor position changes
   */
  onCursorPositionChange?: (position: { lineNumber: number; column: number }) => void;

  /**
   * Callback when a save action is triggered (e.g., Cmd/Ctrl+S)
   */
  onSave?: (content: string) => void;
}

export default function MonacoEditor({
  value = '',
  language = 'javascript',
  height = '100%',
  readOnly = false,
  onChange,
  onCursorPositionChange,
  onSave,
  ...other
}: MonacoEditorProps) {
  const theme = useTheme();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // Calculate theme based on MUI theme
  const editorTheme = getEditorTheme(theme.palette.mode);

  // Handle editor initial setup
  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: any) => {
    editorRef.current = editor;

    // Register custom language supports
    registerLanguages(monaco);

    // Define custom themes
    defineMonacoThemes(monaco, theme);

    // Force apply the theme to ensure it's applied on initial load
    monaco.editor.setTheme(editorTheme);

    // Apply options based on read-only state
    const options = readOnly ? READ_ONLY_EDITOR_OPTIONS : getLanguageSpecificOptions(language);

    // Ensure line numbers have proper padding
    editor.updateOptions({
      ...options,
      lineNumbersMinChars: 5, // Add extra space for line numbers
      lineDecorationsWidth: 16, // Slightly increase decoration width
    });

    // Set up cursor position change callback
    if (onCursorPositionChange) {
      editor.onDidChangeCursorPosition((e) => {
        onCursorPositionChange({
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        });
      });

      // Report initial position
      const initialPosition = editor.getPosition();
      if (initialPosition) {
        onCursorPositionChange({
          lineNumber: initialPosition.lineNumber,
          column: initialPosition.column,
        });
      }
    }
  };

  // Handle value changes
  const handleChange = (newValue: string | undefined) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  // Effect to handle keydown for saving manually on window
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+S (Windows/Linux) or Cmd+S (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        event.stopPropagation();

        // Call onSave with editor content
        if (onSave && editorRef.current) {
          const currentValue = editorRef.current.getValue();
          onSave(currentValue || '');
        }
      }
    };

    // Attach listener to window in capture phase
    window.addEventListener('keydown', handleKeyDown, true);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onSave]); // Re-run effect when onSave changes

  return (
    <Box
      sx={{
        width: '100%',
        height,
        overflow: 'hidden',
        borderRadius: 1,
        '& .monaco-editor': {
          padding: '0',
        },
        '& .monaco-editor .focused': {
          outline: 'none !important',
        },
        '& .monaco-editor-background': {
          outline: 'none',
        },
        '& .monaco-editor .margin, & .monaco-editor .margin-view-overlays': {
          margin: 0,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingLeft: '8px', // Add padding to line numbers container
        },

        '& .monaco-scrollable-element': {
          padding: 0,
          margin: 0,
        },
        '& .monaco-editor .cursors-layer, & .monaco-editor .view-lines, & .monaco-editor, & .monaco-editor-background, & .monaco-editor .inputarea.ime-input':
          {
            outline: 'none !important',
            border: 'none !important',
            boxShadow: 'none !important',
          },
      }}
    >
      <Editor
        defaultValue={value}
        defaultLanguage={language}
        theme={editorTheme}
        options={DEFAULT_EDITOR_OPTIONS}
        onMount={handleEditorDidMount}
        onChange={handleChange}
        {...other}
      />
    </Box>
  );
}
