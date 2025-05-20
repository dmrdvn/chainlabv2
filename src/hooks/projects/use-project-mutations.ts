'use client';

import type { ProjectUpdatePayload } from 'src/types/project';

import { toast } from 'sonner';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSWRConfig } from 'swr';
import { useRouter } from 'next/navigation';

import { CreateProjectParams } from 'src/actions/project/core';
import {
  createProject,
  updateProject,
  deleteProject,
  updateProjectVisibility,
  updateFileContentAction,
  createProjectFileAction,
  createProjectDirectoryAction,
  renameProjectItemAction,
  deleteProjectItemAction,
  createNewEvmContractFilesAction,
  createNewSolanaProgramFilesAction,
  requestCompilationAction
} from 'src/actions/project';
import {
  type UpdateFileContentActionPayload,
  type CreateFilePayload as CreateProjectFileActionPayload,
  type CreateDirectoryPayload as CreateProjectDirectoryActionPayload,
  type RenameItemPayload as RenameProjectItemActionPayload,
  type DeleteItemPayload as DeleteProjectItemActionPayload,
  type CreateNewEvmContractFilesPayload,
  type CreateNewEvmContractFilesResponse,
  type CreateNewSolanaProgramFilesPayload,
  type CreateNewSolanaProgramFilesResponse,
  type RequestCompilationPayload,
  type RequestCompilationResponse,
  type Compilation,
  subscribeToCompilationsByProject
} from 'src/actions/project/resources';

/**
 * Hook to create a new project
 * @returns Function to create project and loading/error state
 */
export function useCreateProject() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateProject = async (projectData: CreateProjectParams) => {
    try {
      setLoading(true);
      setError(null);

      const result = await createProject(projectData);

      if (!result?.id) {
        throw new Error('Failed to get project ID');
      }

      // Update SWR cache
      await mutate('user-projects');

      // Redirect to project page
      /* router.push(`dashboard/projects/${result.id}`); */

      // Show success notification
      toast.success('Project created successfully!');
      return result;
    } catch (err: any) {
      const errorMessage = err?.message || 'An error occurred while creating the project';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Project creation error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createProject: handleCreateProject,
    loading,
    error,
  };
}

/**
 * Hook to update a project
 * @returns Function to update project and loading/error state
 */
export function useUpdateProject() {
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateProject = async (projectId: string, projectData: ProjectUpdatePayload) => {
    try {
      setLoading(true);
      setError(null);

      const result = await updateProject(projectId, projectData);
      if (!result) {
        throw new Error('Failed to update project');
      }

      // Update SWR cache
      await mutate(`project-${projectId}`);
      await mutate('user-projects');

      // Show success notification
      toast.success('Project updated successfully!');
      return result;
    } catch (err: any) {
      const errorMessage = err?.message || 'An error occurred while updating the project';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Project update error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateProject: handleUpdateProject,
    loading,
    error,
  };
}

/**
 * Hook to delete a project
 * @returns Function to delete project and loading/error state
 */
export function useDeleteProject() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteProject = async (projectId: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await deleteProject(projectId);
      if (!result) {
        throw new Error('Failed to delete project');
      }

      // Update SWR cache
      await mutate('user-projects');

      // Redirect to projects page
      /*   router.push('dashboard/projects'); */

      // Show success notification
      toast.success('Project deleted successfully!');
      return true;
    } catch (err: any) {
      const errorMessage = err?.message || 'An error occurred while deleting the project';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Project deletion error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteProject: handleDeleteProject,
    loading,
    error,
  };
}

/**
 * Hook to update project visibility
 * @returns Function to update visibility and loading/error state
 */
export function useUpdateProjectVisibility() {
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateVisibility = async (projectId: string, visibility: 'public' | 'private') => {
    try {
      setLoading(true);
      setError(null);

      const result = await updateProjectVisibility(projectId, visibility);
      if (!result) {
        throw new Error('Failed to update project visibility');
      }

      // Update SWR cache
      await mutate(`project-${projectId}`);
      await mutate('user-projects');

      // Show success notification
      toast.success('Visibility updated successfully!');
      return true;
    } catch (err: any) {
      const errorMessage = err?.message || 'An error occurred while updating visibility';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Visibility update error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateVisibility: handleUpdateVisibility,
    loading,
    error,
  };
}

/**
 * Hook to update the content of a project file.
 * Uses useState for loading/error state management.
 * @returns Function to update file content and loading/error state
 */
export function useUpdateProjectFileContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateFile = async ({ fileId, newContent }: { fileId: string; newContent: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await updateFileContentAction({ fileId, newContent });

      if (!result.success) {
        throw new Error(result.message || 'Failed to update file content');
      }

      setIsLoading(false);
      return result;

    } catch (err: any) {
      const errorMessage = err?.message || 'An error occurred while updating the file content';
      setError(errorMessage);
      console.error('File content update error:', err);
      setIsLoading(false);
      return { success: false, message: errorMessage }; 
    }
  };

  return {
    handleUpdateFile,
    isLoading,
    error,
  };
}

/**
 * Hook to update the content of any project file, typically used when the file ID might not be known upfront
 * or for broader file update operations. This now also uses `updateFileContentAction`.
 */
export function useUpdateAnyProjectFileContent() {
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateFile = async (payload: UpdateFileContentActionPayload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateFileContentAction(payload);

      if (!result.success) {
        throw new Error(result.message || 'Failed to update file content');
      }

      toast.success(result.message || 'File content updated successfully!');
      return result;
    } catch (err: any) {
      const errorMessage = err?.message || 'An error occurred while updating the file content';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('File content update error:', err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { handleUpdateFile, loading, error };
}

/**
 * Hook to create a new project file.
 * @returns Function to create file and loading/error state.
 */
export function useCreateProjectFile() {
  const { mutate } = useSWRConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Define a more specific return type for the hook
  type CreateFileResult = { file_id: string; file_name: string; file_path: string; project_id: string };

  const handleCreateFile = async (payload: CreateProjectFileActionPayload): Promise<CreateFileResult | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createProjectFileAction(payload); // This returns ApiResponse<{ file_id: string }>
      
      let createdFileId: string | null = null;

      if (result && typeof result === 'object' && 'success' in result && result.success && result.data) {
        createdFileId = result.data.file_id;
      } else if (result && 'error' in result && result.error) {
        throw new Error(result.error as string);
      } else {
        throw new Error('Failed to create file or invalid response from action.');
      }

      if (!createdFileId) {
        throw new Error('File ID not returned after creation.');
      }

      if (payload.projectId) {
        mutate(['projectFileHierarchy', payload.projectId]);
      }
      
      // Construct the result object using payload and the returned file_id
      // The payload should contain filePath which includes the fileName.
      // We need to ensure CreateProjectFileActionPayload has 'filePath' which includes the full path.
      // Let's assume payload.filePath is the full path, and we can extract fileName from it if needed or it's directly available.
      // For simplicity, if CreateProjectFileActionPayload has 'fileName' and 'filePath' (or just 'filePath' from which name can be derived)
      
      // Assuming CreateFilePayload (aliased as CreateProjectFileActionPayload) has `filePath` and `projectId`
      // And `fileName` is part of `filePath` or available in payload.
      // The actual `filePath` for the new file comes from `payload.filePath` used in `createProjectFileAction`.
      // The `fileName` can be extracted or is directly part of the payload.
      // For now, assuming payload has `fileName` and `filePath` which seems to be `CreateFilePayload` structure.
      
      // Rechecking CreateFilePayload in resources.ts: { projectId: string; filePath: string; content?: string }
      // We need to extract fileName from payload.filePath
      const fileName = payload.filePath.split('/').pop() || 'unknown_file';

      const newFileInfo: CreateFileResult = {
        file_id: createdFileId,
        file_name: fileName, // Extracted from payload.filePath
        file_path: payload.filePath, // From payload
        project_id: payload.projectId, // From payload
      };

      toast.success(`File '${newFileInfo.file_name}' created successfully!`);
      return newFileInfo;
    } catch (err: any) {
      const errorMessage = err?.message || 'An error occurred while creating the file.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('File creation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createFile: handleCreateFile, isLoading, error };
}

/**
 * Hook to create a new project directory.
 * @returns Function to create directory and loading/error state.
 */
export function useCreateProjectDirectory() {
  const { mutate } = useSWRConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  type CreateDirectoryResult = { directory_id: string; directory_name: string; directory_path: string; project_id: string };

  const handleCreateDirectory = async (payload: CreateProjectDirectoryActionPayload): Promise<CreateDirectoryResult | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // createProjectDirectoryAction returns ApiResponse<{ directory_id: string }>
      const result = await createProjectDirectoryAction(payload);
      
      let createdDirId: string | null = null;
      if (result && result.success && result.data) {
        createdDirId = result.data.directory_id;
      } else if (result && result.error) {
        throw new Error(result.error as string);
      } else {
        throw new Error('Failed to create directory or invalid response from action.');
      }

      if (!createdDirId) {
        throw new Error('Directory ID not returned after creation.');
      }

      if (payload.projectId) {
        mutate(['projectFileHierarchy', payload.projectId]);
      }

      // CreateDirectoryPayload has { projectId: string; directoryPath: string; }
      const directoryName = payload.directoryPath.split('/').pop() || 'unknown_directory';

      const newDirInfo: CreateDirectoryResult = {
        directory_id: createdDirId,
        directory_name: directoryName,
        directory_path: payload.directoryPath,
        project_id: payload.projectId,
      };

      toast.success(`Directory '${newDirInfo.directory_name}' created successfully!`);
      return newDirInfo;
    } catch (err: any) {
      const errorMessage = err?.message || 'An error occurred while creating the directory.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Directory creation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createDirectory: handleCreateDirectory, isLoading, error };
}

/**
 * Hook to rename a project item (file or directory).
 * @returns Function to rename item and loading/error state.
 */
export function useRenameProjectItem() {
  const { mutate } = useSWRConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // renameProjectItemAction returns Promise<ApiResponse<any>>. We'll return a boolean for simplicity.
  const handleRenameItem = async (payload: RenameProjectItemActionPayload): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await renameProjectItemAction(payload);

      if (!result || !result.success) {
        throw new Error(result?.error || 'Failed to rename item.');
      }

      if (payload.projectId) {
        mutate(['projectFileHierarchy', payload.projectId]);
        // If renaming a file, and its content is cached, that cache key might need updating
        // e.g., if cache key includes file path/name.
        // For simplicity, we are not handling granular cache updates here beyond hierarchy.
      }
      
      const oldName = payload.currentPath.split('/').pop();
      const newName = payload.newPath.split('/').pop();
      toast.success(`Item '${oldName}' renamed to '${newName}' successfully!`);
      return true;
    } catch (err: any) {
      const errorMessage = err?.message || 'An error occurred while renaming the item.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Item renaming error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { renameItem: handleRenameItem, isLoading, error };
}

/**
 * Hook to delete a project item (file or directory).
 * @returns Function to delete item and loading/error state.
 */
export function useDeleteProjectItem() {
  const { mutate } = useSWRConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // deleteProjectItemAction returns Promise<ApiResponse<any>>. We'll return a boolean.
  const handleDeleteItem = async (payload: DeleteProjectItemActionPayload): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await deleteProjectItemAction(payload);

      if (!result || !result.success) {
        throw new Error(result?.error || 'Failed to delete item.');
      }

      if (payload.projectId) {
        mutate(['projectFileHierarchy', payload.projectId]);
        // If deleting a file, its content cache should also be invalidated/removed.
        // Consider mutating `['projectFileContent', itemId]` for example.
        // The current `DeleteItemPayload` has `itemPath`. We might need `itemId` if we want to clear content cache.
        // For now, only hierarchy is mutated.
      }

      const itemName = payload.itemPath.split('/').pop();
      toast.success(`Item '${itemName}' deleted successfully!`);
      return true;
    } catch (err: any) {
      const errorMessage = err?.message || 'An error occurred while deleting the item.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Item deletion error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteItem: handleDeleteItem, isLoading, error };
}

/**
 * Hook to create new EVM contract files (contract, test, deploy script) using an RPC.
 * @returns Function to trigger file creation, loading state, and error state.
 */
export function useCreateEvmContractFiles() {
  const { mutate } = useSWRConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateFiles = async (
    payload: CreateNewEvmContractFilesPayload
  ): Promise<CreateNewEvmContractFilesResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('useCreateEvmContractFiles: Calling action with payload:', payload);
      const result = await createNewEvmContractFilesAction(payload);

      if (!result || !result.success || !result.data) {
        const errorMessage = result?.error || 'Failed to create EVM contract files.';
        console.error('useCreateEvmContractFiles: Error from action:', errorMessage, result);
        throw new Error(errorMessage);
      }

      if (payload.projectId) {
        await mutate(['projectFileHierarchy', payload.projectId]);
        await mutate(['projectEvmContracts', payload.projectId]);
        console.log(`useCreateEvmContractFiles: Mutated SWR cache for projectFileHierarchy and projectEvmContracts: ${payload.projectId}`);
      }
      
      toast.success(`Contract files for '${payload.contractName}' created successfully!`);
      console.log('useCreateEvmContractFiles: Files created successfully:', result.data);
      return result.data;

    } catch (err: any) {
      const errorMessage = err?.message || 'An unexpected error occurred while creating EVM contract files.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('useCreateEvmContractFiles: Catch block error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createEvmContractFiles: handleCreateFiles,
    isLoading,
    error,
  };
}

export function useCreateSolanaProgramFiles() {
  const { mutate } = useSWRConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateFiles = async (
    payload: CreateNewSolanaProgramFilesPayload
  ): Promise<CreateNewSolanaProgramFilesResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('useCreateSolanaProgramFiles: Calling action with payload:', payload);
      const result = await createNewSolanaProgramFilesAction(payload);

      if (!result || !result.success || !result.data) {
        const errorMessage = result?.error || 'Failed to create Solana program files.';
        console.error('useCreateSolanaProgramFiles: Error from action:', errorMessage, result);
        throw new Error(errorMessage);
      }

      if (payload.projectId) {
        await mutate(['projectFileHierarchy', payload.projectId]);
        console.log(`useCreateSolanaProgramFiles: Mutated SWR cache for projectFileHierarchy: ${payload.projectId}`);
      }
      
      toast.success(`Program files for '${payload.programName}' created successfully!`);
      console.log('useCreateSolanaProgramFiles: Files created successfully:', result.data);
      return result.data;

    } catch (err: any) {
      const errorMessage = err?.message || 'An unexpected error occurred while creating Solana program files.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('useCreateSolanaProgramFiles: Catch block error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createSolanaProgramFiles: handleCreateFiles,
    isLoading,
    error,
  };
}

/**
 * Hook to request a new compilation for a project.
 * @returns Function to trigger compilation request, loading state, and error state.
 */
export function useRequestCompilation() { 
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestCompilation = async (
    payload: RequestCompilationPayload
  ): Promise<RequestCompilationResponse | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await requestCompilationAction(payload);
      if (!result?.data) {
        throw new Error(result?.error || 'Failed to request compilation');
      }
      toast.success('Compilation requested successfully!');
      return result.data;
    } catch (err: any) {
      const errorMessage = err?.message || 'An error occurred while requesting compilation';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Compilation request error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    requestCompilation: handleRequestCompilation,
    loading,
    error,
  };
}

// --- Realtime Compilation Subscription Hook ---

export interface UseProjectCompilationSubscriptionProps {
  projectId: string | null | undefined;
  onDataChange: (payload: RealtimePostgresChangesPayload<Compilation>) => void;
  onSubscriptionStatusChange?: (status: "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR", error?: Error) => void;
  enabled?: boolean; // New prop to control subscription
}

export function useProjectCompilationSubscription({
  projectId,
  onDataChange,
  onSubscriptionStatusChange,
  enabled = false, // Default to false
}: UseProjectCompilationSubscriptionProps) {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !projectId) {
      if (channelRef.current) {
        console.log(`[Hook] Unsubscribing because not enabled or no projectId: ${projectId}`);
        channelRef.current.unsubscribe().catch(err => console.error("Error unsubscribing (disabled/no projectId):", err));
        channelRef.current = null;
        setIsSubscribed(false);
      }
      return;
    }

    console.log(`[Hook] Attempting to subscribe to compilations for project: ${projectId}`);
    setSubscriptionError(null);

    const newChannel = subscribeToCompilationsByProject(projectId, (payload) => {
      // console.log("[Hook] Data changed:", payload);
      onDataChange(payload);
    });

    channelRef.current = newChannel;

    const subscription = newChannel.subscribe((status, err) => {
      console.log(`[Hook] Subscription status: ${status} for project: ${projectId}`);
      if (status === 'SUBSCRIBED') {
        setIsSubscribed(true);
        setSubscriptionError(null);
      } else {
        setIsSubscribed(false);
        if (err) {
          setSubscriptionError(err);
          console.error(`[Hook] Subscription error for project ${projectId}:`, err);
        }
      }
      if (onSubscriptionStatusChange) {
        onSubscriptionStatusChange(status, err);
      }
    });

    return () => {
      console.log(`[Hook] Cleanup: Unsubscribing from project: ${projectId}`);
      if (channelRef.current) {
        channelRef.current.unsubscribe().catch(err => console.error("Error unsubscribing (cleanup):", err));
        channelRef.current = null;
      }
      setIsSubscribed(false);
    };
  }, [projectId, onDataChange, onSubscriptionStatusChange, enabled]);

  return {
    isSubscribed,
    subscriptionError,
  };
}

// --- End of Realtime Compilation Subscription Hook ---
