'use client';

import type { TableHeadCellProps } from 'src/components/table/table-head-custom';
import type { Project, ProjectHierarchyItem, DisplayableContractInfo } from 'src/types/project';

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useLatestNews } from 'src/hooks/use-news';
import {
  useProjects,
  useProjectById,
  useCurrentProject,
  useProjectFrontends,
  useProjectEvmContracts,
  useProjectSolanaPrograms,
} from 'src/hooks/projects';

import { DashboardContent } from 'src/layouts/dashboard';
import { SeoIllustration } from 'src/assets/illustrations';

import { EmptyContent } from 'src/components/empty-content';

import { useAuthContext } from 'src/auth/hooks';

import { DeploymentStatus, CompilationStatus, AuditProcessStatus } from 'src/types/project';

import { LabsWelcome } from '../labs-welcome';
import LabsContracts from '../labs-contracts';
import { LabsFeatured } from '../labs-featured';
import { LabsFrontends } from '../labs-frontends';
import { LabsWidgetSummary } from '../labs-widget-summary';

function mapProjectHierarchyItemToDisplayableContractInfo(
  item: ProjectHierarchyItem,
  projectId: string | null,
  currentProjectVersionId?: string | null
): DisplayableContractInfo {
  return {
    id: item.id || item.path,
    project_id: projectId ?? '',
    project_version_id: currentProjectVersionId ?? '',
    name: item.name,
    file_path: item.path,
    platform: item.platform,

    description: null,
    tags: null,

    compilation_status: CompilationStatus.NOT_COMPILED,
    last_compiled_at: null,

    deployment_status: DeploymentStatus.NOT_DEPLOYED,
    last_deployed_at: null,
    deployment_id: null,

    audit_status: AuditProcessStatus.NO_AUDIT,
    last_audit_at: null,

    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function OverviewLabsView() {
  const { user } = useAuthContext();
  const { projectId } = useCurrentProject();
  const { projects, projectsLoading } = useProjects();
  const router = useRouter();
  const theme = useTheme();

  // isLoading -> projectLoading olarak düzeltildi.
  const { project: currentProjectFromHook, projectLoading: projectDetailsLoading } = useProjectById(
    projectId ?? null
  );
  const currentProjectDetails: Project | null | undefined = currentProjectFromHook;

  const hasNoProjects = !projectsLoading && (!projects || projects.length === 0);

  const isEvmPlatform = !projectDetailsLoading && currentProjectDetails?.platform === 'evm';
  const isSolanaPlatform = !projectDetailsLoading && currentProjectDetails?.platform === 'solana';

  const {
    evmContracts,
    isLoading: evmLoading,
    error: evmError,
  } = useProjectEvmContracts(isEvmPlatform ? (projectId ?? null) : null);

  const {
    solanaPrograms,
    isLoading: solanaLoading,
    error: solanaError,
  } = useProjectSolanaPrograms(isSolanaPlatform ? (projectId ?? null) : null);

  const { items, itemsLoading, itemsError } = useMemo(() => {
    if (projectDetailsLoading) {
      return { items: [], itemsLoading: true, itemsError: null };
    }
    if (!currentProjectDetails || !currentProjectDetails.platform) {
      return { items: [], itemsLoading: false, itemsError: null };
    }

    if (currentProjectDetails.platform === 'evm') {
      return { items: evmContracts || [], itemsLoading: evmLoading, itemsError: evmError };
    }
    if (currentProjectDetails.platform === 'solana') {
      return { items: solanaPrograms || [], itemsLoading: solanaLoading, itemsError: solanaError };
    }
    return { items: [], itemsLoading: false, itemsError: null };
  }, [
    currentProjectDetails,
    projectDetailsLoading,
    evmContracts,
    evmLoading,
    evmError,
    solanaPrograms,
    solanaLoading,
    solanaError,
  ]);

  const {
    frontends: frontendsResponse,
    frontendsLoading,
    frontendsError,
  } = useProjectFrontends(projectId ?? null);

  const { news, newsLoading } = useLatestNews();

  useEffect(() => {
    console.log('overview-labs-view: projectId', projectId);
    console.log('overview-labs-view: currentProjectDetails', currentProjectDetails);
    console.log('overview-labs-view: platform', currentProjectDetails?.platform);
    console.log('overview-labs-view: items (contracts/programs)', items);
    console.log('overview-labs-view: itemsLoading', itemsLoading);
    console.log('overview-labs-view: itemsError', itemsError);
    console.log('overview-labs-view: frontendsResponse', frontendsResponse);
    console.log('overview-labs-view: frontendsLoading', frontendsLoading);
    console.log('overview-labs-view: frontendsError', frontendsError);
  }, [
    projectId,
    currentProjectDetails,
    items,
    itemsLoading,
    itemsError,
    frontendsResponse,
    frontendsLoading,
    frontendsError,
  ]);

  const handleCreateProject = () => {
    router.push(paths.dashboard.projects.new);
  };

  const handleCreateContract = () => {
    router.push(paths.dashboard.projects.details(projectId ?? ''));
  };

  const handleCreateFrontend = () => {
    router.push(paths.dashboard.frontendEditor);
  };

  const handleViewAllContracts = () => {
    if (projectId) {
      router.push(paths.dashboard.projects.details(projectId));
    } else {
      console.error('Cannot navigate to project details: projectId is null.');
    }
  };

  const handleViewAllFrontends = () => {
    router.push(paths.dashboard.frontendEditor);
  };

  const displayableContracts = useMemo(
    () =>
      items
        .filter(
          (item) =>
            (item.type === 'file' &&
              (item.file_type === 'solidity' || item.file_type === 'rust')) ||
            (item.type === 'directory' &&
              item.file_type === 'anchor-program' &&
              item.platform === 'solana')
        )
        .map((item) =>
          mapProjectHierarchyItemToDisplayableContractInfo(
            item,
            projectId ?? null,
            currentProjectDetails?.active_project_version_id
          )
        ),
    [items, projectId, currentProjectDetails]
  );

  const frontends = frontendsResponse || [];

  const CONTRACTS_TABLE_HEAD: TableHeadCellProps[] = [
    { id: 'name', label: 'Name' },
    { id: 'file_path', label: 'File Path' },
    { id: 'platform', label: 'Platform' },
    { id: 'compilation_status', label: 'Compilation' },
    { id: 'deployment_status', label: 'Deployment' },
  ];

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <LabsWelcome
            title={`Welcome 👋 \n ${user?.displayName || 'User'}`}
            description={
              hasNoProjects
                ? 'Welcome to ChainLab! Create your first project to get started.'
                : 'You are now in the dashboard of your project. You can create new contracts or projects.'
            }
            img={<SeoIllustration hideBackground />}
            action={
              hasNoProjects ? (
                <Button variant="contained" color="primary" onClick={handleCreateProject}>
                  Create Project
                </Button>
              ) : null
            }
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <LabsFeatured list={news} isLoading={newsLoading} />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <LabsWidgetSummary
            title={`Tested ${isEvmPlatform ? 'Contract' : 'Program'}`}
            percent={2.6}
            total={1}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [15, 18, 12, 51, 68, 11, 39, 37],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <LabsWidgetSummary
            title={`Deployed ${isEvmPlatform ? 'Contract' : 'Program'}`}
            percent={-0.1}
            total={frontends?.length || 0}
            chart={{
              colors: [theme.palette.error.main],
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [18, 19, 31, 8, 16, 37, 12, 33],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <LabsWidgetSummary
            title={`Audited ${isEvmPlatform ? 'Contract' : 'Program'}`}
            percent={0.2}
            total={0}
            chart={{
              colors: [theme.palette.info.main],
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [20, 41, 63, 33, 28, 35, 50, 46],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          {hasNoProjects ? (
            <Card sx={{ p: 3, minHeight: 300 }}>
              <EmptyContent
                title="No Project!"
                description="You don't have a project. Create one to get started."
              />
            </Card>
          ) : projectDetailsLoading || itemsLoading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 300,
              }}
            >
              <CircularProgress />
            </Box>
          ) : displayableContracts && displayableContracts.length > 0 ? (
            <LabsContracts
              title={isEvmPlatform ? 'Contracts' : 'Programs'}
              tableData={displayableContracts}
              tableLabels={CONTRACTS_TABLE_HEAD}
              onViewAll={handleViewAllContracts}
              sx={{ height: 1 }}
            />
          ) : (
            <Card sx={{ p: 3, minHeight: 300 }}>
              <EmptyContent
                title={`No ${isEvmPlatform ? 'contracts' : 'programs'} found`}
                description={`You don't have any ${isEvmPlatform ? 'contracts' : 'programs'} yet. Start by creating your first ${isEvmPlatform ? 'contract' : 'program'}.`}
                action={
                  <Box sx={{ mt: 4, mb: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleCreateContract}>
                      Create a {isEvmPlatform ? 'Contract' : 'Program'}
                    </Button>
                  </Box>
                }
              />
            </Card>
          )}
        </Grid>

        <Grid size={{ xs: 12 }}>
          {hasNoProjects ? (
            <Card sx={{ p: 3, minHeight: 300 }}>
              <EmptyContent
                title="No Project!"
                description="You don't have a project. Create one to get started."
              />
            </Card>
          ) : frontendsLoading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 300,
              }}
            >
              <CircularProgress />
            </Box>
          ) : frontends && frontends.length > 0 ? (
            <LabsFrontends
              title="Your Frontend UIs"
              tableData={frontends}
              onViewAll={handleViewAllFrontends}
              headCells={[
                { id: 'name', label: 'UI Name' },
                { id: 'framework', label: 'Framework' },
                { id: 'status', label: 'Status' },
                { id: 'created_at', label: 'Created At' },
                { id: 'updated_at', label: 'Updated At' },
                { id: '' },
              ]}
            />
          ) : (
            <Card sx={{ p: 3, minHeight: 300 }}>
              <EmptyContent
                title="No frontend found"
                description="You don't have any frontends yet. Start by creating your first frontend."
                action={
                  <Box sx={{ mt: 4, mb: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleCreateFrontend}>
                      Create a Frontend
                    </Button>
                  </Box>
                }
              />
            </Card>
          )}
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
