import type { Theme } from '@mui/material/styles';
import type { Monaco } from '@monaco-editor/react';

/**
 * Define a custom theme for Monaco editor that matches the app theme
 */
export function defineMonacoThemes(monaco: Monaco, theme: Theme): void {
  // Define a theme that matches the Material UI dark theme
  monaco.editor.defineTheme('material-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955' },
      { token: 'keyword', foreground: 'C586C0' },
      { token: 'keyword.type', foreground: '569CD6' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'delimiter', foreground: 'CCCCCC' },
      { token: 'constant', foreground: '4FC1FF' },
      { token: 'identifier', foreground: '9CDCFE' },
      { token: 'type.identifier', foreground: '4EC9B0' },
    ],
    colors: {
      'editor.background': theme.palette.background.default,
      'editor.foreground': theme.palette.text.primary,
      'editorLineNumber.foreground': theme.palette.text.secondary,
      'editorLineNumber.activeForeground': theme.palette.text.primary,

      // Selection background - using neutral gray instead of red
      'editor.selectionBackground': '#3A3D41',
      'editor.inactiveSelectionBackground': '#3A3D4180',

      'editorGutter.background': theme.palette.background.default,
      'editor.lineHighlightBackground': theme.palette.action.hover + '40',

      // Scrollbar styling - thinner and gray instead of red
      'scrollbarSlider.background': '#79797966',
      'scrollbarSlider.hoverBackground': '#79797999',
      'scrollbarSlider.activeBackground': '#BFBFBFCC',

      // Minimap styling
      'minimap.background': theme.palette.background.default,
      'minimap.selectionHighlight': theme.palette.primary.main + '40',

      // Code suggestion widget styling - VS Code like
      'editorSuggestWidget.background': theme.palette.background.paper,
      'editorSuggestWidget.border': '#fff',
      'editorSuggestWidget.foreground': theme.palette.text.primary,
      'editorSuggestWidget.selectedBackground': '#04395e', // VS Code dark blue for selected item
      'editorSuggestWidget.highlightForeground': '#fff', // VS Code light blue for highlighted text

      // Hover widget styling
      'editorHoverWidget.background': theme.palette.background.paper,
      'editorHoverWidget.border': theme.palette.divider,

      // Folded code styling - using gray instead of red
      'editor.foldBackground': '#264f7840',

      // Bracket matching - using VS Code colors
      'editorBracketMatch.background': '#515c6a',
      'editorBracketMatch.border': '#888888',
    },
  });

  // Define a theme that matches VS Code light theme and example screenshot
  monaco.editor.defineTheme('material-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '008000' }, // Green
      { token: 'keyword', foreground: '0000FF' }, // Blue
      { token: 'string', foreground: 'A31515' }, // Dark Red
      { token: 'number', foreground: '098658' }, // Dark Green
      { token: 'operator', foreground: '000000' }, // Black
      { token: 'delimiter', foreground: '000000' }, // Black
      { token: 'identifier', foreground: '001080' }, // Dark Blue
      { token: 'type.identifier', foreground: '267F99' }, // Teal

      // Additional token types from screenshot
      { token: 'keyword.control', foreground: 'AF00DB' }, // Purple
      { token: 'keyword.operator', foreground: '000000' }, // Black
      { token: 'variable', foreground: '001080' }, // Dark Blue
      { token: 'variable.predefined', foreground: '0070C1' }, // Blue
      { token: 'function', foreground: '795E26' }, // Brown
      { token: 'variable.parameter', foreground: '001080' }, // Dark Blue
      { token: 'property', foreground: '001080' }, // Dark Blue
      { token: 'constant', foreground: '0070C1' }, // Blue
      { token: 'boolean', foreground: '0000FF' }, // Blue
    ],
    colors: {
      // Main editor colors
      'editor.background': '#FFFFFF', // Pure white background
      'editor.foreground': '#000000', // Black text
      'editorLineNumber.foreground': '#6E7681', // Gray line numbers
      'editorLineNumber.activeForeground': '#000000', // Black active line number

      // Selection and highlighting
      'editor.selectionBackground': '#ADD6FF80', // Light blue selection
      'editor.inactiveSelectionBackground': '#E5EBF1', // Very light blue when unfocused
      'editor.lineHighlightBackground': '#F3F3F3', // Very light gray for current line

      // Gutter and scrollbars
      'editorGutter.background': '#FFFFFF', // White gutter
      'scrollbarSlider.background': '#64646466', // Translucent gray scrollbar
      'scrollbarSlider.hoverBackground': '#646464A6', // Darker when hovered
      'scrollbarSlider.activeBackground': '#BFBFBFCC', // Active scrollbar

      // Minimap
      'minimap.background': '#FFFFFF',
      'minimap.selectionHighlight': '#3794FF40',

      // Widgets and UI elements
      'editorSuggestWidget.background': '#F8F8F8',
      'editorSuggestWidget.border': '#DDDDDD',
      'editorSuggestWidget.foreground': '#000000',
      'editorSuggestWidget.selectedBackground': '#E8E8E8',
      'editorSuggestWidget.highlightForeground': '#0066BF',

      // Hover and tooltips
      'editorHoverWidget.background': '#F8F8F8',
      'editorHoverWidget.border': '#DDDDDD',

      // Folding
      'editor.foldBackground': '#E6E6E640',

      // Bracket matching
      'editorBracketMatch.background': '#BBBBBB40',
      'editorBracketMatch.border': '#BBBBBB',
    },
  });
}

/**
 * Get the appropriate theme based on the app's current theme mode
 */
export function getEditorTheme(themeMode: 'light' | 'dark'): string {
  return themeMode === 'dark' ? 'material-dark' : 'material-light';
}
