/**
 * Maps file extensions to Monaco editor language identifiers
 * @param filePath - Path to the file
 * @returns Language identifier for Monaco editor
 */
export function getLanguageFromPath(filePath: string | null | undefined): string {
  if (!filePath) {
    return 'plaintext';
  }

  const extension = filePath.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    case 'sol':
      return 'solidity';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'c':
      return 'c';
    case 'cpp':
    case 'cc':
    case 'h':
    case 'hpp':
      return 'cpp';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    default:
      return 'plaintext';
  }
}

/**
 * Get content type for a file
 * Useful when working with APIs that require content-type
 * @param filePath - Path to the file
 * @returns appropriate content type string
 */
export function getContentTypeFromPath(filePath: string | null | undefined): string {
  if (!filePath) {
    return 'text/plain';
  }

  const extension = filePath.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return 'application/javascript';
    case 'json':
      return 'application/json';
    case 'css':
      return 'text/css';
    case 'html':
      return 'text/html';
    case 'sol':
      return 'text/plain'; // No official mime type for Solidity
    case 'md':
      return 'text/markdown';
    case 'py':
      return 'text/x-python';
    case 'java':
      return 'text/x-java';
    case 'c':
    case 'cpp':
    case 'cc':
    case 'h':
    case 'hpp':
      return 'text/x-c';
    case 'go':
      return 'text/x-go';
    case 'rs':
      return 'text/x-rust';
    default:
      return 'text/plain';
  }
}
