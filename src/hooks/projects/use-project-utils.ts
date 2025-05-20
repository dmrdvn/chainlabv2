'use client';

import useSWR from 'swr';
import { useMemo, useState, useEffect } from 'react';

import { getPermissions } from 'src/actions/project/permissions';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { useProjectMembers } from './use-project-queries';

// PermissionContext tipini burada tanımlıyoruz
interface PermissionContext {
  projectId: string | null;
  userId: string | null;
  isLoading: boolean;
  can: (permission: string) => boolean;
  canAny: (permissions: string[]) => boolean;
  canAll: (permissions: string[]) => boolean;
  getMemberData: (targetUserId: string) => any | null;
  getMemberPermissions: (targetUserId: string) => string[];
  userHasPermission: (targetUserId: string, permission: string) => boolean;
  userHasAnyPermission: (targetUserId: string, permissions: string[]) => boolean;
}

// Event constants for project changes (used across components)
export const PROJECT_CHANGE_EVENT = 'chainlab-project-changed';

/**
 * Aktif proje ID'sini almak için hook
 * Şimdilik localStorage'dan alıyor, ileride URL veya context'ten alabilir
 * @returns Aktif proje ID'si veya null
 */
export function useCurrentProject() {
  // Başlangıç değeri undefined yapıldı
  const [projectId, setProjectId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    // Tarayıcı ortamında olduğumuzdan emin ol
    if (typeof window !== 'undefined') {
      // localStorage'dan aktif proje ID'sini al
      const storedProjectId = localStorage.getItem('currentProjectId');
      // Eğer değer varsa string, yoksa null olarak ayarla
      setProjectId(storedProjectId);
    }
  }, []);

  // Helper function to dispatch project change events
  const dispatchProjectChangeEvent = (id: string, source: string = 'hook') => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent(PROJECT_CHANGE_EVENT, {
        detail: {
          projectId: id,
          timestamp: Date.now(),
          source,
        },
      });
      window.dispatchEvent(event);
      console.log(`Project change event dispatched from ${source}: ${id}`);
    }
  };

  // Proje ID'sini değiştirmek için fonksiyon
  const setCurrentProject = (id: string | null, source: string = 'hook') => {
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('currentProjectId', id);
        // Dispatch event when project changes
        dispatchProjectChangeEvent(id, source);
      } else {
        localStorage.removeItem('currentProjectId');
      }
      setProjectId(id);
    }
  };

  return { projectId, setCurrentProject };
}

/**
 * Kullanılabilir izinleri çekmek için kullanılan hook
 * @returns Tüm izinler ve yüklenme durumu
 */
export function usePermissions() {
  const { data, isLoading, error, isValidating } = useSWR(
    'available-permissions',
    async () => {
      try {
        // permissions.ts dosyasındaki getPermissions fonksiyonunu kullanıyoruz
        const permissions = await getPermissions();
        return permissions;
      } catch (err) {
        console.error('İzinler alınırken hata:', err);
        throw err;
      }
    },
    {
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return useMemo(
    () => ({
      permissions: data || [],
      loading: isLoading,
      error,
      validating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

/**
 * Kullanıcının bir proje içindeki izinlerini yönetmek için kullanılan hook
 * @param projectId Proje ID
 * @param userId Kullanıcı ID (belirtilmezse mevcut kullanıcıyı kullanır)
 * @returns İzinleri yönetmek için gerekli fonksiyonlar
 */
export function useProjectPermissions(projectId: string | null, userId?: string | null) {
  const { user } = useAuthContext();
  const currentUserId = userId || user?.id;
  const { collaborators, collaboratorsLoading, hasPermission, hasAnyPermission } = useProjectMembers(projectId);

  // Projedeki tüm kullanıcı izinleri
  const memoizedValue = useMemo(() => {
    const contextValues: PermissionContext = {
      projectId: projectId || null,
      userId: currentUserId || null,
      isLoading: collaboratorsLoading,

      // İzin kontrolü için yardımcı fonksiyonlar
      can: (permission: string) => {
        if (!projectId || !currentUserId) return false;
        return hasPermission(currentUserId, permission);
      },

      canAny: (permissions: string[]) => {
        if (!projectId || !currentUserId) return false;
        if (!permissions.length) return false;
        return hasAnyPermission(currentUserId, permissions);
      },

      canAll: (permissions: string[]) => {
        if (!projectId || !currentUserId) return false;
        if (!permissions.length) return true; // boş liste kontrolü

        // Verilen tüm izinlere sahip olma durumunu kontrol et
        return permissions.every((permission) => hasPermission(currentUserId, permission));
      },

      // İlgili üye verisin bul
      getMemberData: (targetUserId: string) => {
        if (!collaborators || !collaborators.length) return null;
        return collaborators.find((member) => member.user_id === targetUserId) || null;
      },

      // Üye izinlerinin listesini al
      getMemberPermissions: (targetUserId: string) => {
        if (!collaborators || !collaborators.length) return [];
        const memberData = collaborators.find((member) => member.user_id === targetUserId);
        if (!memberData) return [];
        return memberData.all_permissions || [];
      },

      // Belirli bir kullanıcının izin kontrolü
      userHasPermission: (targetUserId: string, permission: string) => {
        if (!collaborators || !collaborators.length) return false;
        return hasPermission(targetUserId, permission);
      },

      // Belirli bir kullanıcının herhangi bir izne sahip olma durumu
      userHasAnyPermission: (targetUserId: string, permissions: string[]) => {
        if (!collaborators || !collaborators.length) return false;
        return hasAnyPermission(targetUserId, permissions);
      },
    };

    return contextValues;
  }, [projectId, currentUserId, collaborators, collaboratorsLoading, hasPermission, hasAnyPermission]);

  return memoizedValue;
}
