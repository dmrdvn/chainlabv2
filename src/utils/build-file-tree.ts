import type { ProjectFile } from 'src/types/project';

/**
 * Represents a node in the file tree structure used by the TreeView component.
 */
export interface FileTreeNode {
  id: string; // Use file/folder path as unique ID for tree nodes
  name: string; // Display name (file or folder name)
  children?: FileTreeNode[];
  originalData?: ProjectFile;
  isDirectory: boolean;
}

/**
 * Transforms a flat list of ProjectFile objects into a hierarchical FileTreeNode structure.
 *
 * @param files - The flat list of project files from the database.
 * @returns An array of root FileTreeNode objects.
 */
export function buildFileTree(files: ProjectFile[]): FileTreeNode[] {
  const tree: FileTreeNode[] = [];
  const map: { [key: string]: FileTreeNode } = {};

  const sortedFiles = files
    .filter((file: ProjectFile): file is ProjectFile => !!file && !!file.file_path)
    .sort((a: ProjectFile, b: ProjectFile) => a.file_path.localeCompare(b.file_path));

  sortedFiles.forEach((file: ProjectFile) => {
    const cleanedPath = file.file_path.startsWith('/')
      ? file.file_path.substring(1)
      : file.file_path;
    
    // Filter out empty strings that might result from multiple slashes e.g. path///fileName
    const pathParts = cleanedPath.split('/').filter(part => part.length > 0);

    let accumulatedPath = '';

    pathParts.forEach((part: string, index: number) => {
      accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
      const isLastPart = index === pathParts.length - 1;

      let node = map[accumulatedPath];

      if (!node) {
        node = {
          id: accumulatedPath,
          name: part,
          isDirectory: isLastPart ? file.is_directory : true,
          children: isLastPart && !file.is_directory ? undefined : [],
          originalData: isLastPart ? file : undefined,
        };
        map[accumulatedPath] = node;

        if (index === 0) {
          if (!tree.some(rootNode => rootNode.id === node.id)) {
            tree.push(node);
          }
        } else {
          const parentPath = pathParts.slice(0, index).join('/');
          const parentNode = map[parentPath];
          if (parentNode && parentNode.children) {
            if (!parentNode.children.some(childNode => childNode.id === node.id)) {
              parentNode.children.push(node);
            }
          } else {
            console.warn(`buildFileTree: Parent node '${parentPath}' not found for child '${node.name}'. Adding to root as fallback.`);
            if (!tree.some(rootNode => rootNode.id === node.id)) {
              tree.push(node);
            }
          }
        }
      } else {
        // Node already exists, potentially update it if this 'file' entry is more specific
        if (isLastPart) {
          // If this file entry explicitly defines this path segment
          node.isDirectory = file.is_directory;
          if (file.is_directory && !node.children) {
            node.children = [];
          }
          if (!file.is_directory) {
            node.children = undefined; // Ensure files don't have a children array
          }
          node.originalData = file; // Update with the specific file data
        } else if (node.isDirectory && !node.children) {
          // If it's an intermediate path and confirmed as directory, ensure children array
          node.children = [];
        }
      }
    });
  });

  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(tree);
  return tree;
}