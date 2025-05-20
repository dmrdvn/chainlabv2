/**
 * Monaco Editor Component
 *
 * This module exports a fully-featured code editor based on Monaco Editor
 * with support for multiple languages and automatic theming.
 */

// Theme configuration
export * from './theme';
// Configuration exports
export * from './config';

// Language support
export * from './languages';

// Component export
export { default as MonacoEditor } from './monaco-editor';

export type { MonacoEditorProps } from './monaco-editor';
