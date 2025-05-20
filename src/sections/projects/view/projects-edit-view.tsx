'use client';

import type { ProjectUpdatePayload } from 'src/types/project';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useUpdateProject, useProjectDetails } from 'src/hooks/projects';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// Proje form bileşeni importu
import { ProjectsNewEditForm } from '../projects-new-edit-form';

// ----------------------------------------------------------------------

export function ProjectsEditView() {
  // URL parametrelerinden proje ID'sini alma
  const params = useParams();
  const projectId = typeof params?.id === 'string' ? params.id : null;
  const router = useRouter();
  // SWR ile proje detayını çekme
  const { project, projectLoading, projectError, refreshProject } = useProjectDetails(projectId);

  // Proje güncelleme hook'u
  const { updateProject, loading: isUpdating, error } = useUpdateProject();
  const [updateSuccess, setUpdateSuccess] = useState(false);
  // Error tipini uyumlu hale getir
  const updateError = error ? new Error(String(error)) : null;

  // Başarılı güncelleme sonrası proje detaylarını yeniden çek
  useEffect(() => {
    if (updateSuccess) {
      router.push(paths.dashboard.projects.root);
    }
  }, [updateSuccess, refreshProject]);

  const resetUpdateStatus = () => {
    setUpdateSuccess(false);
  };

  const renderLoading = <CircularProgress />;

  const renderError = (
    <Alert severity="error">
      {projectError?.message || 'Proje detayları yüklenirken bir hata oluştu'}
    </Alert>
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit Project"
        backHref={projectId ? `/dashboard/projects/${projectId}` : paths.dashboard.projects.root}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Projects', href: paths.dashboard.projects.root },
          { name: project?.name || 'Edit Project' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {projectLoading && renderLoading}

      {projectError && renderError}

      {project && (
        <ProjectsNewEditForm
          currentProject={project}
          isEditing
          onUpdateProject={async (data: ProjectUpdatePayload) => {
            if (projectId) {
              const result = await updateProject(projectId, data);
              if (result) {
                setUpdateSuccess(true);
              }
            }
          }}
          isUpdating={isUpdating}
          updateError={updateError}
          updateSuccess={updateSuccess}
          resetUpdateStatus={resetUpdateStatus}
        />
      )}
    </DashboardContent>
  );
}
