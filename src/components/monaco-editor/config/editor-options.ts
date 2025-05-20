import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

/**
 * Default options for Monaco Editor
 * See: https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.IStandaloneEditorConstructionOptions.html
 */
export const DEFAULT_EDITOR_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions = {
  fontSize: 14,
  lineHeight: 1.5,

  scrollBeyondLastLine: false,
  minimap: {
    enabled: true,
    scale: 1,
    showSlider: 'mouseover',
  },
  automaticLayout: true,
  wordWrap: 'on',
  overviewRulerBorder: true,
  hideCursorInOverviewRuler: true,
  renderLineHighlightOnlyWhenFocus: true,
  renderLineHighlight: 'none',
  glyphMargin: false,
  folding: true,
  foldingStrategy: 'auto',
  foldingHighlight: true,
  lineNumbersMinChars: 4,
  fixedOverflowWidgets: true,
  lineDecorationsWidth: 15,
  padding: {
    top: 10,
    bottom: 0,
  },
  scrollbar: {
    useShadows: false,
    verticalHasArrows: false,
    horizontalHasArrows: false,
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
    alwaysConsumeMouseWheel: false,
    arrowSize: 8,
  },
  guides: {
    indentation: true,
    highlightActiveIndentation: true,
  },
};

/**
 * Options specifically for read-only views
 */
export const READ_ONLY_EDITOR_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions = {
  ...DEFAULT_EDITOR_OPTIONS,
  readOnly: true,
  domReadOnly: true,
  cursorBlinking: 'solid',
};

/**
 * Get language-specific editor options
 */
export function getLanguageSpecificOptions(
  language: string
): monaco.editor.IStandaloneEditorConstructionOptions {
  const baseOptions = { ...DEFAULT_EDITOR_OPTIONS };

  switch (language) {
    case 'solidity':
      return {
        ...baseOptions,
        tabSize: 1,
      };
    case 'javascript':
    case 'typescript':
      return {
        ...baseOptions,
        tabSize: 2,
        detectIndentation: true,
      };
    default:
      return baseOptions;
  }
}
