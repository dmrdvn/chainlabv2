// Hooks for fetching project file data using SWR

import type { ProjectFile, ProjectHierarchyItem } from 'src/types/project';

import useSWR, { useSWRConfig } from 'swr';

import {
  getProjectHierarchyAction,
  getProjectFile,
  getProjectFrontends,
} from 'src/actions/project';
import {
  getProjectEvmContractsAction,
  getProjectSolanaProgramsAction,
} from 'src/actions/project/resources';
import { useMemo, useEffect } from 'react';
import { useProjectById } from './use-project-queries';

// ----------------------------------------------------------------------

/**
 * Hook to fetch the file hierarchy for a specific project.
 * Uses SWR for caching and revalidation.
 * @param projectId The ID of the project.
 * @returns Object containing hierarchy data, loading state, error, and refresh function.
 */
export function useProjectFileHierarchy(projectId: string | null) {
  const key = projectId ? ['projectFileHierarchy', projectId] : null;

  // Using a stable fetcher function reference is important for SWR
  const fetchProjectHierarchy = async ([_, pId]: [string, string]) => {
    const response = await getProjectHierarchyAction(pId);
    if (!response.success || !response.data) {
      // Optionally, you can throw an error that SWR can catch
      // or return a specific error structure if your API returns detailed errors.
      throw new Error(response.error || 'Failed to fetch project hierarchy');
    }
    return response.data;
  };

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    ProjectHierarchyItem[] | null,
    Error
  >(key, fetchProjectHierarchy, {
    keepPreviousData: true,
  });

  return {
    hierarchy: data,
    hierarchyLoading: isLoading,
    hierarchyError: error,
    hierarchyValidating: isValidating,
    refreshHierarchy: mutate,
  };
}

// ----------------------------------------------------------------------

/**
 * Hook to fetch the content and details of a specific project file.
 * Uses SWR for caching and revalidation.
 * @param fileId The ID of the file.
 * @returns Object containing file data, loading state, error, and refresh function.
 */
export function useProjectFileContent(fileId: string | null) {
  // Import SETTINGS_FILE_ID from contract editor
  const SETTINGS_FILE_ID = 'settings:general';

  // Only set key if it's a valid fileId and not the settings file
  const shouldFetch = fileId && fileId !== SETTINGS_FILE_ID;
  const key = shouldFetch ? ['projectFileContent', fileId] : null;

  // Using a stable fetcher function reference
  const fetchProjectFileContent = async ([_, fId]: [string, string]) => getProjectFile(fId);

  const { data, error, isLoading, isValidating, mutate } = useSWR<ProjectFile | null, Error>(
    key,
    fetchProjectFileContent,
    {
      // Keep previous data while loading new file content
      keepPreviousData: true,
      // Disable automatic refetch when the window gains focus
      revalidateOnFocus: false,
      // Optional: Also disable refetch on reconnect if desired
      // revalidateOnReconnect: false,

      // Optional: Add other custom SWR configuration here
    }
  );

  // Handle special case for settings file after hook calls
  if (fileId === SETTINGS_FILE_ID) {
    return {
      file: null,
      fileLoading: false,
      fileError: null,
      fileValidating: false,
      refreshFile: () => Promise.resolve(),
    };
  }

  return {
    file: data,
    fileLoading: isLoading,
    fileError: error,
    fileValidating: isValidating,
    refreshFile: mutate, // Function to trigger revalidation
  };
}

// ----------------------------------------------------------------------

/**
 * Hook to fetch EVM contract files for a specific project.
 * It filters files based on the project's platform ('evm') and file characteristics (e.g., .sol extension or file_type).
 * @param projectId The ID of the project.
 * @returns Object containing EVM contract files, loading state, error, and refresh function.
 */
export function useProjectEvmContracts(projectId: string | null) {
  const key = projectId ? ['projectEvmContracts', projectId] : null;

  const fetchEvmContracts = async ([_, pId]: [string, string]): Promise<ProjectHierarchyItem[]> => {
    const response = await getProjectEvmContractsAction(pId);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch EVM contracts');
    }
    return response.data;
  };

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    ProjectHierarchyItem[] | null,
    Error
  >(key, fetchEvmContracts, {
    keepPreviousData: true, // İsteğe bağlı
  });

  return {
    evmContracts: data,
    isLoading: isLoading,
    error: error,
    refreshContracts: mutate,
    isValidating: isValidating,
  };
}

// ----------------------------------------------------------------------

/**
 * Hook to fetch Solana program files for a specific project.
 * It filters files based on the project's platform ('solana') and file characteristics (e.g., .rs extension or file_type).
 * @param projectId The ID of the project.
 * @returns Object containing Solana program files, loading state, error, and refresh function.
 */
export function useProjectSolanaPrograms(projectId: string | null) {
  const key = projectId ? ['projectSolanaPrograms', projectId] : null;

  const fetchSolanaPrograms = async ([_, pId]: [string, string]): Promise<
    ProjectHierarchyItem[]
  > => {
    const response = await getProjectSolanaProgramsAction(pId);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch Solana programs');
    }
    return response.data;
  };

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    ProjectHierarchyItem[] | null,
    Error
  >(key, fetchSolanaPrograms, {
    keepPreviousData: true, // İsteğe bağlı
  });

  return {
    solanaPrograms: data,
    isLoading: isLoading,
    error: error,
    refreshPrograms: mutate,
    isValidating: isValidating,
  };
}

export function useProjectFrontends(projectId: string | null) {
  const { mutate: globalMutate } = useSWRConfig();

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    projectId ? `project-frontends-${projectId}` : null,
    async () => {
      try {
        if (!projectId) {
          /* console.log('useProjectFrontends: projectId boş, boş dizi dönülüyor'); */
          return [];
        }

        /* console.log('useProjectFrontends: Frontendler çekiliyor, projectId:', projectId); */
        const frontends = await getProjectFrontends(projectId);
        /* console.log('useProjectFrontends: Frontendler başarıyla alındı:', frontends); */
        return frontends;
      } catch (err) {
        console.error('useProjectFrontends: Frontendler alınırken hata:', err);
        throw err;
      }
    },
    {
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      dedupingInterval: 2000, // 2 saniye içinde tekrar eden istekleri engelle
      onError: (err) => {
        console.error('useProjectFrontends: SWR hata yakaladı:', err);
      },
    }
  );

  // projectId değiştiğinde tüm ilgili cache'leri temizle
  useEffect(() => {
    if (projectId) {
      console.log('useProjectFrontends: Proje ID değişti, cache temizleniyor:', projectId);
      globalMutate(
        (key) => typeof key === 'string' && key.startsWith('project-frontends-'),
        undefined,
        { revalidate: true }
      );
    }
  }, [projectId, globalMutate]);

  const memoizedValue = useMemo(
    () => ({
      frontends: data || [],
      frontendsLoading: isLoading,
      frontendsError: error,
      frontendsValidating: isValidating,
      refreshFrontends: () => {
        if (!projectId) {
          console.log('useProjectFrontends: projectId boş, yenileme yapılmıyor');
          return Promise.resolve();
        }
        console.log('useProjectFrontends: Frontendler yenileniyor, projectId:', projectId);
        return mutate();
      },
    }),
    [data, error, isLoading, isValidating, mutate, projectId]
  );

  return memoizedValue;
}
