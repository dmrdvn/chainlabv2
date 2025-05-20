'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { paths } from 'src/routes/paths';

import { useCreateProject } from 'src/hooks/projects';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProjectsNewEditForm } from '../projects-new-edit-form';

// ----------------------------------------------------------------------

export function ProjectsCreateView() {
  const router = useRouter();

  // Proje oluşturma hook'unu kullan
  const { createProject, loading: isCreating, error } = useCreateProject();
  const [createSuccess, setCreateSuccess] = useState(false);

  // Error tipini uyumlu hale getir
  const createError = error ? new Error(String(error)) : null;

  useEffect(() => {
    if (createSuccess) {
      router.push(paths.dashboard.projects.root);
    }
  }, [createSuccess, router]);

  const resetCreateStatus = () => {
    setCreateSuccess(false);
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new project"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Projects', href: paths.dashboard.projects.root },
          { name: 'New Project' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ProjectsNewEditForm
        isEditing={false}
        onCreateProject={async (data) => {
          const result = await createProject(data);
          if (result) {
            setCreateSuccess(true);
          }
        }}
        isCreating={isCreating}
        createError={createError}
        createSuccess={createSuccess}
        resetCreateStatus={resetCreateStatus}
      />
    </DashboardContent>
  );
}
