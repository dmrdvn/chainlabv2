'use client';

import type { Project, ProjectFilters } from 'src/types/project';

import { orderBy } from 'es-toolkit';
import { useState, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useProjects, useProjectFilterOptions } from 'src/hooks/projects';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// Projeler için sıralama seçenekleri
const PROJECT_SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
];

import { ProjectsList } from '../projects-list';
import { ProjectsSort } from '../projects-sort';
import { ProjectsSearch } from '../projects-search';
import { ProjectsFilters } from '../projects-filters';
import { ProjectsFiltersResult } from '../projects-filters-result';

// ----------------------------------------------------------------------

export function ProjectsListView() {
  const openFilters = useBoolean();
  const { projects, projectsLoading } = useProjects();
  const { filterOptions, loading: filterOptionsLoading } = useProjectFilterOptions();

  const [sortBy, setSortBy] = useState('latest');

  const filters = useSetState<ProjectFilters>({
    tags: [],
    visibility: [],
  });
  const { state: currentFilters } = filters;

  const dataFiltered = applyFilter({
    inputData: projects,
    filters: currentFilters,
    sortBy,
  });

  const canReset =
    /* currentFilters.roles.length > 0 ||
  currentFilters.locations.length > 0 ||
  currentFilters.benefits.length > 0 ||
  currentFilters.employmentTypes.length > 0 ||
  currentFilters.experience !== 'all'; */
    currentFilters.tags.length > 0 || currentFilters.visibility.length > 0;

  const notFound = !dataFiltered.length && canReset;

  const handleSortBy = useCallback((newValue: string) => {
    setSortBy(newValue);
  }, []);

  const renderFilters = () => (
    <Box
      sx={{
        gap: 3,
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-end', sm: 'center' },
      }}
    >
      <ProjectsSearch redirectPath={(id: string) => paths.dashboard.projects.details(id)} />

      <Box sx={{ gap: 1, flexShrink: 0, display: 'flex' }}>
        <ProjectsFilters
          filters={filters}
          canReset={canReset}
          open={openFilters.value}
          onOpen={openFilters.onTrue}
          onClose={openFilters.onFalse}
          options={{
            tags: filterOptionsLoading ? ['Loading...'] : filterOptions.tags,
            visibility: filterOptionsLoading ? ['Loading...'] : filterOptions.visibilities,
          }}
        />

        <ProjectsSort sort={sortBy} onSort={handleSortBy} sortOptions={PROJECT_SORT_OPTIONS} />
      </Box>
    </Box>
  );

  const renderResults = () => (
    <ProjectsFiltersResult filters={filters} totalResults={dataFiltered.length} />
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="All Projects"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Projects', href: paths.dashboard.projects.root },
          { name: 'All Projects' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.projects.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            New Project
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={2.5} sx={{ mb: { xs: 3, md: 5 } }}>
        {renderFilters()}
        {canReset && renderResults()}
      </Stack>

      {notFound && <EmptyContent filled sx={{ py: 10 }} />}

      {projectsLoading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
          <EmptyContent title="Loading..." sx={{ py: 10 }} />
        </Stack>
      ) : (
        <ProjectsList projects={dataFiltered} />
      )}
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  sortBy: string;
  filters: ProjectFilters;
  inputData: Project[];
};

function applyFilter({ inputData, filters, sortBy }: ApplyFilterProps) {
  const { tags, visibility } = filters;

  // Eğer veri yoksa boş dizi döndür
  if (!inputData || !inputData.length) {
    return [];
  }

  let filteredData = [...inputData];

  // Sort by
  if (sortBy === 'latest') {
    filteredData = orderBy(filteredData, ['created_at'], ['desc']);
  }

  if (sortBy === 'oldest') {
    filteredData = orderBy(filteredData, ['created_at'], ['asc']);
  }

  if (sortBy === 'name_asc') {
    filteredData = orderBy(filteredData, ['name'], ['asc']);
  }

  if (sortBy === 'name_desc') {
    filteredData = orderBy(filteredData, ['name'], ['desc']);
  }

  // Filters
  if (visibility && visibility.length) {
    filteredData = filteredData.filter((project) => visibility.includes(project.visibility));
  }

  if (tags && tags.length) {
    filteredData = filteredData.filter(
      (project) => project.tags && project.tags.some((tag) => tags.includes(tag))
    );
  }

  return filteredData;
}
