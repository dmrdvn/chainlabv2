'use client';

import type { Project, ProjectFilters } from 'src/types/project';
import type { ProjectCollaborator } from 'src/types/member';

import useSWR, { useSWRConfig } from 'swr';
import { useMemo, useEffect, useCallback } from 'react';

import {
  getProjectById,
  getProjectTags,
  getUserProjects,
  getProjectOwner,
  getProjectMembers,
  getProjectVisibilities,
  isProjectOwner as checkProjectOwner,
} from 'src/actions/project';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

/**
 * Kullanıcının projelerini çekmek ve cache'lemek için hook
 * @returns Projeler ve ilgili durumlar
 */
export function useProjects() {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    'user-projects',
    async () => {
      try {
        const projects = await getUserProjects();

        // Null kontrolü ekle
        if (projects === null) {
          console.error('Projeler alınamadı: Null değer döndü');
          return [];
        }

        return projects;
      } catch (err) {
        console.error('Projeler alınırken hata:', err);
        throw err; // SWR hata yönetimi için hatayı yeniden fırlat
      }
    },
    {
      revalidateIfStale: true,
      revalidateOnFocus: false, // Her odaklanmada değil, sadece gerektiğinde yeniden yükle
      revalidateOnReconnect: true,
      errorRetryCount: 3, // En fazla 3 kez yeniden dene
      dedupingInterval: 5000, // 5 saniye içinde tekrar eden istekleri birleştir
      focusThrottleInterval: 10000, // Odak değişiminde en az 10 saniye bekle
    }
  );

  const memoizedValue = useMemo(
    () => ({
      projects: Array.isArray(data) ? data : [], // Tip güvenliği için array kontrolü ekle
      projectsLoading: isLoading,
      projectsError: error,
      projectsValidating: isValidating,
      projectsEmpty: !isLoading && !isValidating && (!data || data.length === 0),
      refresh: () => mutate(),
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

/**
 * Tek bir proje detayını çekmek için hook (SWR ile)
 * @param projectId Proje ID
 * @returns Proje detayı ve ilgili durumlar
 */
export function useProjectDetails(projectId: string | null) {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    projectId ? `project-${projectId}` : null,
    async () => {
      try {
        if (!projectId) return null;

        /* console.log(`Fetching project details for ID: ${projectId}`); */
        const project = await getProjectById(projectId);

        if (!project) {
          console.warn(`Project with ID ${projectId} not found`);
          return null;
        }

        return project;
      } catch (err) {
        console.error(`Error fetching project details for ID ${projectId}:`, err);
        throw err; // SWR hata yönetimi için hatayı yeniden fırlat
      }
    },
    {
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 2, // Maksimum 2 deneme
      dedupingInterval: 3000, // 3 saniye içinde tekrar eden istekleri birleştir
    }
  );

  const memoizedValue = useMemo(
    () => ({
      project: data || null,
      projectLoading: isLoading,
      projectError: error,
      projectValidating: isValidating,
      refreshProject: () => mutate(),
      isProjectFound: data !== null,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

/**
 * Proje sahibinin bilgilerini çekmek için hook
 * @param ownerId Proje sahibi ID
 * @returns Proje sahibi bilgileri ve ilgili durumlar
 */
export function useProjectOwner(ownerId: string | null) {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    ownerId ? `project-owner-${ownerId}` : null,
    async () => {
      try {
        if (!ownerId) {
          console.log('Owner ID not provided, returning null');
          return null;
        }

        console.log(`Fetching owner details for ID: ${ownerId}`);
        const owner = await getProjectOwner(ownerId);

        // getProjectOwner her zaman bir değer döndürür (varsayılan bile olsa)
        // o yüzden sadece başarılı olarak logla
        /* console.log(`Successfully fetched owner details for ID: ${ownerId}`); */

        return owner;
      } catch (err) {
        console.error(`Error fetching owner details for ID ${ownerId}:`, err);
        throw err; // SWR hata yönetimi için hatayı yeniden fırlat
      }
    },
    {
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 2,
      dedupingInterval: 5000,
    }
  );

  const memoizedValue = useMemo(
    () => ({
      owner: data || null,
      ownerLoading: isLoading,
      ownerError: error,
      ownerValidating: isValidating,
      refreshOwner: () => mutate(),
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

/**
 * Proje üyelerini ve izinlerini çekmek için hook
 * @param projectId Proje ID
 * @returns Proje üyeleri, izinleri ve ilgili durumlar
 */
export function useProjectMembers(projectId: string | null) {
  const { user } = useAuthContext();
  const currentUserId = user?.id;

  // Proje üyeleri verilerini çeken SWR hook'u
  const { data, isLoading, error, isValidating, mutate } = useSWR<ProjectCollaborator[]>(
    projectId ? `project-members-${projectId}` : null,
    async () => {
      try {
        if (!projectId) return [];

        /* console.log(`Fetching collaborators for project ID: ${projectId}`); */
        const collaborators = await getProjectMembers(projectId);

        if (!Array.isArray(collaborators)) {
          console.warn(
            `Invalid collaborators data format for project ID ${projectId}:`,
            collaborators
          );
          return [];
        }

        return collaborators;
      } catch (err) {
        console.error(`Error fetching collaborators for project ID ${projectId}:`, err);
        throw err; // SWR hata yönetimi için hatayı yeniden fırlat
      }
    },
    {
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 2,
      dedupingInterval: 3000,
    }
  );

  // Proje sahibi olup olmadığını kontrol eden SWR hook'u (mevcut kullanıcı için)
  const { data: ownerData } = useSWR(
    currentUserId && projectId ? `current-user-is-owner-${projectId}` : null,
    async () => {
      try {
        if (!currentUserId || !projectId) return { isOwner: false };

        const isOwner = await checkProjectOwner(currentUserId, projectId);
        return { isOwner };
      } catch (err) {
        console.error(
          `Error checking project ownership for user ${currentUserId}, project ${projectId}:`,
          err
        );
        // Hata durumunda sahip olmadığını varsay (güvenli taraf)
        return { isOwner: false };
      }
    },
    {
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  // Null-check ile daha güvenli bir değer alma
  const isCurrentUserProjectOwner = ownerData?.isOwner ?? false;
  // Tip güvenliği için array kontrolü ve doğru tip
  const collaborators = Array.isArray(data) ? data : [];

  // --- İzin Kontrol Fonksiyonları (Güncellenmeli!) ---
  // Bu fonksiyonlar artık 'collaborator_type' kontrolü yapmalı
  // ve 'all_permissions' alanı sadece 'member' tipindekiler için geçerli olmalı.
  // Şimdilik bu fonksiyonları devre dışı bırakalım veya güncelleyelim.
  // Basitlik adına şimdilik 'hasPermission' ve 'hasAnyPermission'
  // fonksiyonlarını güncellenmiş veri yapısıyla çalışacak şekilde düzenleyelim.
  // NOT: 'all_permissions' alanının RPC'den gelip gelmediğini kontrol etmemiz gerekebilir.
  //      Eğer gelmiyorsa, bu izin kontrolleri şu an çalışmaz.

  const hasPermission = useCallback(
    (userIdOrEmail: string, permission: string): boolean => {
      if (!userIdOrEmail || !permission || collaborators.length === 0) return false;

      const collaborator = collaborators.find((c) =>
        c.collaborator_type === 'member' ? c.user_id === userIdOrEmail : c.email === userIdOrEmail
      );

      if (!collaborator) return false;

      // Sahipse her zaman izinli
      if (
        collaborator.user_id &&
        collaborator.user_id === currentUserId &&
        isCurrentUserProjectOwner
      ) {
        return true;
      }

      // Sadece üyelerin izinleri olabilir ve 'all_permissions' alanı gerekli
      if (collaborator.collaborator_type === 'member' && collaborator.user_id) {
        // RPC'nin all_permissions döndürdüğünü varsayıyoruz.
        const permissions = collaborator.all_permissions;
        if (!permissions || !Array.isArray(permissions)) return false;
        return permissions.includes(permission);
      }

      // Bekleyen davetlerin izni olmaz
      return false;
    },
    [collaborators, currentUserId, isCurrentUserProjectOwner]
  );

  const hasAnyPermission = useCallback(
    (userIdOrEmail: string, permissionList: string[]): boolean => {
      if (!userIdOrEmail || !permissionList.length || collaborators.length === 0) return false;

      const collaborator = collaborators.find((c) =>
        c.collaborator_type === 'member' ? c.user_id === userIdOrEmail : c.email === userIdOrEmail
      );

      if (!collaborator) return false;

      // Sahipse her zaman izinli
      if (
        collaborator.user_id &&
        collaborator.user_id === currentUserId &&
        isCurrentUserProjectOwner
      ) {
        return true;
      }

      // Sadece üyelerin izinleri olabilir ve 'all_permissions' alanı gerekli
      if (collaborator.collaborator_type === 'member' && collaborator.user_id) {
        // RPC'nin all_permissions döndürdüğünü varsayıyoruz.
        const permissions = collaborator.all_permissions;
        if (!permissions || !Array.isArray(permissions)) return false;

        return permissionList.some((p) => permissions.includes(p));
      }

      // Bekleyen davetlerin izni olmaz
      return false;
    },
    [collaborators, currentUserId, isCurrentUserProjectOwner]
  );

  const memoizedValue = useMemo(
    () => ({
      collaborators,
      collaboratorsLoading: isLoading,
      collaboratorsError: error,
      collaboratorsValidating: isValidating,
      refreshMembers: () => mutate(),
      isCurrentUserProjectOwner,
      hasPermission,
      hasAnyPermission,
    }),
    [
      collaborators,
      isLoading,
      error,
      isValidating,
      mutate,
      isCurrentUserProjectOwner,
      hasPermission,
      hasAnyPermission,
    ]
  );

  return memoizedValue;
}

/**
 * Workspace popover için gerekli projeleri çekme hook'u
 * @returns Workspace formatında projeler ve ilgili durumlar
 */
export function useWorkspaces() {
  const { projects, projectsLoading, projectsError, refresh } = useProjects();

  return useMemo(
    () => ({
      projects,
      loading: projectsLoading,
      error: projectsError,
      refresh,
    }),
    [projects, projectsLoading, projectsError, refresh]
  );
}

/**
 * Projeler için kullanılan tüm benzersiz etiketleri (tags) çeken hook
 * @returns Etiket listesi ve ilgili durumları
 */
export function useProjectTags() {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    'project-tags',
    async () => {
      const tags = await getProjectTags();
      return tags;
    },
    {
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const memoizedValue = useMemo(
    () => ({
      tags: data || [],
      tagsLoading: isLoading,
      tagsError: error,
      tagsValidating: isValidating,
      refreshTags: () => mutate(),
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

/**
 * Projeler için kullanılan tüm benzersiz görünürlük (visibility) değerlerini çeken hook
 * @returns Görünürlük listesi ve ilgili durumları
 */
export function useProjectVisibilities() {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    'project-visibilities',
    async () => {
      const visibilities = await getProjectVisibilities();
      return visibilities;
    },
    {
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const memoizedValue = useMemo(
    () => ({
      visibilities: data || [],
      visibilitiesLoading: isLoading,
      visibilitiesError: error,
      visibilitiesValidating: isValidating,
      refreshVisibilities: () => mutate(),
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

/**
 * Projelerin filtreleme seçeneklerini çeken birleşik hook
 * @returns Tüm filtre seçenekleri ve durumları
 */
export function useProjectFilterOptions() {
  const { tags, tagsLoading, tagsError } = useProjectTags();
  const { visibilities, visibilitiesLoading, visibilitiesError } = useProjectVisibilities();

  const loading = tagsLoading || visibilitiesLoading;
  const error = tagsError || visibilitiesError;

  return useMemo(
    () => ({
      filterOptions: {
        tags,
        visibilities,
      },
      loading,
      error,
    }),
    [tags, visibilities, loading, error]
  );
}

/**
 * Hook to fetch details for a specific project by its ID.
 * Uses SWR for caching and revalidation.
 * @param projectId The ID of the project.
 * @returns Object containing project data, loading state, error, and refresh function.
 */
export function useProjectById(projectId: string | null) {
  const key = projectId ? ['project', projectId] : null;

  const fetchProjectDetails = async ([_, pId]: [string, string]): Promise<Project | null> => {
    try {
      const project = await getProjectById(pId);
      // getProjectById ya Project döner ya da null (veya hata fırlatır)
      // Bu yüzden karmaşık ApiResponse kontrolüne gerek yok.
      if (project === null) {
        console.warn(`Project with ID ${pId} not found or getProjectById returned null.`);
      }
      return project;
    } catch (error) {
      console.error(`Error in fetchProjectDetails for project ID ${pId}:`, error);
      // Hata SWR'a iletilir, SWR kendi hata yönetimini yapar.
      throw error;
    }
  };

  const { data, error, isLoading, isValidating, mutate } = useSWR<Project | null, Error>(
    key,
    fetchProjectDetails,
    {
      keepPreviousData: true,
      revalidateOnFocus: false, // Consider project data doesn't change that frequently on focus
    }
  );

  return {
    project: data,
    projectLoading: isLoading,
    projectError: error,
    projectValidating: isValidating,
    refreshProject: mutate,
  };
}
