import type { Project } from 'src/types/project';

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Pagination, { paginationClasses } from '@mui/material/Pagination';

import { paths } from 'src/routes/paths';

import { useDeleteProject } from 'src/hooks/projects';

import { ConfirmDialog } from 'src/components/custom-dialog';

import { ProjectsItem } from './projects-item';

// ----------------------------------------------------------------------

type Props = {
  projects: Project[];
  isLoading?: boolean;
  isError?: boolean;
  refetch?: () => void;
};

export function ProjectsList({
  projects = [],
  isLoading = false,
  isError = false,
  refetch,
}: Props) {
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { deleteProject, loading, error: deleteError } = useDeleteProject();

  const router = useRouter();

  const handleDeleteClick = useCallback((id: string, name: string) => {
    setSelectedProjectId(id);
    setSelectedProjectName(name);
    setOpenDeleteDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDeleteDialog(false);
  }, []);

  const handleDeleteProject = async () => {
    if (!selectedProjectId) return;

    try {
      await deleteProject(selectedProjectId);
      setOpenDeleteDialog(false);
      setSelectedProjectId(null);

      // Force a refetch to update the list
      if (refetch) {
        refetch();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  return (
    <>
      <Box
        sx={{
          gap: 3,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        }}
      >
        {projects.map((project) => (
          <ProjectsItem
            key={project.id}
            project={project}
            editHref={paths.dashboard.projects.edit(project.id)}
            detailsHref={paths.dashboard.projects.details(project.id)}
            onDelete={() => handleDeleteClick(project.id, project.name)}
          />
        ))}
      </Box>

      {projects.length > 8 && (
        <Pagination
          count={8}
          sx={{
            mt: { xs: 8, md: 8 },
            [`& .${paginationClasses.ul}`]: { justifyContent: 'center' },
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openDeleteDialog}
        onClose={handleCloseDialog}
        title="Delete Project"
        content="Are you sure you want to delete this project? This action cannot be undone."
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteProject}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        }
      />
    </>
  );
}
