import type { Monaco } from '@monaco-editor/react';

import { registerSolidityLanguage } from './solidity';

// Track which languages have been registered
const registeredLanguages = new Set<string>();

/**
 * Register all custom language supports
 * This function is optimized to only register languages once
 */
export function registerLanguages(monaco: Monaco): void {
  // Register Solidity if not already registered
  if (!registeredLanguages.has('solidity')) {
    registerSolidityLanguage(monaco);
    registeredLanguages.add('solidity');
  }

  // Add other language registrations here in the future
}
