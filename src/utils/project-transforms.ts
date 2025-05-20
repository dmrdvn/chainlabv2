import type { ProjectFile, ProjectHierarchyItem } from 'src/types/project';

/**
 * Transforms a list of project hierarchy items into a flat list of project files.
 * @param items - The array of ProjectHierarchyItem objects.
 * @param projectId - The ID of the project.
 * @returns An array of ProjectFile objects.
 */
export function transformHierarchyToFlatProjectFiles(
  items: ProjectHierarchyItem[],
  projectId: string
): ProjectFile[] {
  if (!items) {
    return [];
  }
  return items.map(item => {
    const projectFile: ProjectFile = {
      id: item.id, // from ProjectHierarchyItem
      project_id: projectId, // from parameter
      project_version_id: '', // Placeholder: Not in ProjectHierarchyItem.
      parent_id: item.parent_id, // from ProjectHierarchyItem
      file_name: item.name,    // from ProjectHierarchyItem
      file_path: item.path,    // from ProjectHierarchyItem
      is_directory: item.type === 'directory', // Derived from ProjectHierarchyItem.type
      content: null,          // Content not needed for sidebar tree view structure
      // ProjectHierarchyItem.file_type is the mime_type from the RPC for files.
      mime_type: item.type === 'file' ? item.file_type : null,
      // We can leave ProjectFile.file_type (for UI icons) as null/undefined for now
      // or derive it later from file_name extension if needed.
      file_type: null, // Explicitly setting to null, can be enhanced later for specific UI icons
      created_at: new Date().toISOString(), // Placeholder, use actual if available
      updated_at: new Date().toISOString(), // Placeholder, use actual if available
    };
    return projectFile;
  });
}