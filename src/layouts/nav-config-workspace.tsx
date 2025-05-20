'use client';

import { useMemo } from 'react';

import { useProjects } from 'src/hooks/projects';

import { CONFIG } from 'src/global-config';

import type { WorkspacesPopoverProps } from './components/workspaces-popover';

/**
 * Projeleri workspace formatında döndüren hook
 * @returns Workspace formatında projeler
 */
export function useWorkspacesFromProjects() {
  const { projects, projectsLoading } = useProjects();

  // Projeleri workspace formatına dönüştür
  const projectsAsWorkspaces = useMemo<WorkspacesPopoverProps['data']>(
    () =>
      projects?.map((project) => ({
        id: project.id,
        name: project.name,
        logo: project.logo_url || `${CONFIG.assetsDir}/assets/icons/workspaces/logo-1.webp`,
        visibility: project.visibility === 'private' ? 'Private' : 'Public',
      })) || [],
    [projects]
  );

  // Yükleme durumu veya veri yoksa varsayılan workspace'ler, aksi halde projeler
  const workspaces = useMemo(
    () =>
      projectsLoading || !projectsAsWorkspaces || projectsAsWorkspaces.length === 0
        ? []
        : projectsAsWorkspaces,
    [projectsLoading, projectsAsWorkspaces]
  );

  return { workspaces, loading: projectsLoading };
}
