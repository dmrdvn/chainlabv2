'use client';

import { useParams } from 'next/navigation';
import { useTabs } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import {
  useProjectDetails,
  useProjectMembers,
  useUpdateProjectVisibility,
} from 'src/hooks/projects';

import { DashboardContent } from 'src/layouts/dashboard';

import { ProjectsDetailsLabs } from '../projects-details-labs';
import { ProjectsDetailsToolbar } from '../projects-details-toolbar';
import { ProjectsDetailsContent } from '../projects-details-content';
import { ProjectsDetailsCollabs } from '../projects-details-collabs';

// ----------------------------------------------------------------------

// Project visibility options
const PROJECT_VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
];

// Project detail tabs
const PROJECT_DETAILS_TABS = [
  { value: 'content', label: 'Content' },
  { value: 'labs', label: 'Contracts & Frontends' },
  { value: 'collabs', label: 'Collabs' },
];

export function ProjectsDetailsView() {
  const params = useParams();
  const projectId = typeof params?.id === 'string' ? params.id : null;
  const tabs = useTabs('content');
  const { project, projectLoading, projectError, refreshProject } = useProjectDetails(projectId);
  const owner = project?.owner_details || null;
  const ownerLoading = projectLoading;
  const { collaborators, collaboratorsLoading, refreshMembers } = useProjectMembers(projectId);

  // Hook for updating project visibility
  const { updateVisibility } = useUpdateProjectVisibility();

  const [visibility, setVisibility] = useState<string>('');

  // Set visibility state when the project data is loaded
  useEffect(() => {
    if (project?.visibility) {
      setVisibility(project.visibility);
    }
  }, [project]);

  const handleChangeVisibility = useCallback(
    async (newValue: string) => {
      try {
        if (!projectId) return;

        // Local state'i güncelle (kullanıcı arayüzü hemen değişsin)
        setVisibility(newValue);

        // Call the API to update visibility
        const success = await updateVisibility(projectId, newValue as 'public' | 'private');

        if (success) {
          refreshProject(); // Refresh project details on success
        }
      } catch (error) {
        console.error('Error updating visibility:', error);
      }
    },
    [projectId, project?.visibility, updateVisibility]
  );

  const renderToolbar = () => (
    <ProjectsDetailsToolbar
      backHref={paths.dashboard.projects.root}
      editHref={paths.dashboard.projects.edit(`${project?.id}`)}
      liveHref="#"
      publish={visibility}
      onChangePublish={handleChangeVisibility}
      publishOptions={PROJECT_VISIBILITY_OPTIONS}
    />
  );

  const renderTabs = () => (
    <Tabs value={tabs.value} onChange={tabs.onChange} sx={{ mb: { xs: 3, md: 5 } }}>
      {PROJECT_DETAILS_TABS.map((tab) => (
        <Tab
          key={tab.value}
          iconPosition="end"
          value={tab.value}
          label={
            tab.value === 'collabs' ? (
              <Stack direction="row" spacing={1} alignItems="center">
                {tab.label}
                {!collaboratorsLoading && collaborators.length > 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      ml: 1,
                      px: 1.2,
                      py: 0.2,
                      borderRadius: 10,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      minWidth: 20,
                      textAlign: 'center',
                      display: 'inline-block',
                    }}
                  >
                    {collaborators.length > 99 ? '99+' : collaborators.length}
                  </Typography>
                )}
              </Stack>
            ) : (
              tab.label
            )
          }
        />
      ))}
    </Tabs>
  );

  // Check for loading state first
  if (projectLoading) {
    return (
      <DashboardContent>
        <div>Loading project details...</div>
      </DashboardContent>
    );
  }

  // Handle project loading error
  if (projectError) {
    return (
      <DashboardContent>
        <div>Error loading project: {projectError.message}</div>
      </DashboardContent>
    );
  }

  // Handle case where project is not found after loading
  if (!project) {
    return (
      <DashboardContent>
        <div>Project not found</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      {renderToolbar()}
      {renderTabs()}

      {tabs.value === 'content' && (
        <ProjectsDetailsContent project={project} owner={owner} ownerLoading={ownerLoading} />
      )}

      {tabs.value === 'labs' && project && <ProjectsDetailsLabs projectId={projectId || ''} />}

      {tabs.value === 'collabs' && (
        <ProjectsDetailsCollabs
          projectId={projectId || ''}
          loading={collaboratorsLoading}
          onSuccess={() => refreshMembers()}
        />
      )}
    </DashboardContent>
  );
}
