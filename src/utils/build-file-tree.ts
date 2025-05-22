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
  const artificialRoot: FileTreeNode = {
    id: '__artificial_root__',
    name: 'Root',
    isDirectory: true,
    children: [],
  };
  const map: { [key: string]: FileTreeNode } = {};

  const sortedFiles = files
    .filter((file: ProjectFile): file is ProjectFile => !!file && !!file.file_path)
    .sort((a: ProjectFile, b: ProjectFile) => a.file_path.localeCompare(b.file_path));

  sortedFiles.forEach((file: ProjectFile) => {
    const cleanedPath = file.file_path.startsWith('/')
      ? file.file_path.substring(1)
      : file.file_path;

    // Filter out empty strings that might result from multiple slashes e.g. path///fileName
    const pathParts = cleanedPath.split('/').filter((part) => part.length > 0);

    let currentLevelChildren = artificialRoot.children!; // Başlangıçta yapay kökün çocukları
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
          // Children dizisi, eğer bir dizinse ve son parça değilse ya da son parça ve bir dizinse oluşturulur
          children: isLastPart && !file.is_directory ? undefined : [],
          originalData: isLastPart ? file : undefined,
        };
        map[accumulatedPath] = node;

        // Düğümü doğru ebeveynin çocuklarına ekle
        if (index === 0) {
          // Eğer pathParts'ın ilk elemanı ise, yapay kökün çocuğu olmalı
          if (!currentLevelChildren.some((rootNode) => rootNode.id === node!.id)) {
            currentLevelChildren.push(node);
          }
        } else {
          // Değilse, bir önceki parçanın oluşturduğu düğümün çocuğu olmalı
          const parentPath = pathParts.slice(0, index).join('/');
          const parentNode = map[parentPath];
          if (parentNode && parentNode.children) {
            if (!parentNode.children.some((childNode) => childNode.id === node!.id)) {
              parentNode.children.push(node);
            }
          } else {
            // Bu durum normalde olmamalı, çünkü ebeveynler önce işlenir
            // Güvenlik için, eğer ebeveyn bulunamazsa yapay köke ekle
            console.warn(
              `buildFileTree: Parent node '${parentPath}' not found for child '${node.name}'. Adding to artificial root as fallback.`
            );
            if (!artificialRoot.children!.some((rootNode) => rootNode.id === node!.id)) {
              artificialRoot.children!.push(node);
            }
          }
        }
      } else {
        // Düğüm zaten var (önceki bir dosya yolu tarafından bir dizin olarak oluşturulmuş olabilir)
        if (isLastPart) {
          // Bu dosya yolu bu düğümü tanımlıyorsa, bilgilerini güncelle
          node.isDirectory = file.is_directory;
          node.originalData = file;
          if (file.is_directory && !node.children) {
            node.children = [];
          } else if (!file.is_directory) {
            node.children = undefined; // Dosyaların çocukları olmaz
          }
        } else if (node.isDirectory && !node.children) {
          // Eğer bir ara yol (dizin) ise ve children yoksa, oluştur
          node.children = [];
        }
      }
      // Bir sonraki seviye için children dizisini güncelle
      if (node.isDirectory && node.children) {
        currentLevelChildren = node.children;
      }
    });
  });

  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(artificialRoot.children!);
  return [artificialRoot]; // Her zaman yapay kökü içeren bir dizi döndür
}
