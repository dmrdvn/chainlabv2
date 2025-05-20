import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import {
  getLanguageFromPath as getLanguageFromPathUtil,
  DEFAULT_EDITOR_OPTIONS as DEFAULT_EDITOR_CONFIG,
} from 'src/components/monaco-editor/config';

/**
 * @deprecated Use the version from 'src/components/monaco-editor/config' instead
 */
export const DEFAULT_EDITOR_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions =
  DEFAULT_EDITOR_CONFIG;

/**
 * @deprecated Use the version from 'src/components/monaco-editor/config' instead
 */
export const getLanguageFromPath = getLanguageFromPathUtil;
