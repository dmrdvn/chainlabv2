'use client';

import type { Project, ProjectSocialLinks, ProjectUpdatePayload } from 'src/types/project';

import { supabase } from 'src/lib/supabase';

/**
 * Parameters required to create a new project
 */
export interface CreateProjectParams extends Partial<Project> {
  social_links?: ProjectSocialLinks | null;
}

/**
 * Function to create a new project
 * @param projectData Project data
 * @returns The created project or null
 */
export async function createProject(projectData: CreateProjectParams): Promise<Project | null> {
  try {
    console.log('=== SERVER ACTION: createProject (v2 RPC) started ===');
    console.log('Project data:', projectData);

    // 1. Check user session (RPC'ler SECURITY DEFINER olduğu için aslında gerekmeyebilir, ama frontend'de ön kontrol iyi olabilir)
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      console.error(
        'Active session not found or error fetching session, project cannot be created:',
        sessionError?.message
      );
      return null;
    }

    // const userId = sessionData.session.user.id; // Artık RPC'ye gönderilmiyor

    // 2. Call the RPC function create_new_project
    const rpcParams = {
      p_name: projectData.name || 'New Project',
      p_description: projectData.description || '',
      p_platform: projectData.platform || 'evm', // default evm
      p_visibility: projectData.visibility || 'private',
      p_github_repo_url: projectData.github_repo_url || null,
      p_tags: projectData.tags || [],
      p_logo_url: projectData.logo_url || null, // Added logo_url
      p_social_links: projectData.social_links || null, // Added social_links (ensure projectData can have this)
    };
    console.log('Calling RPC create_new_project with params:', rpcParams);

    const { data: newProjectFromRpc, error: rpcError } = await supabase.rpc(
      'create_new_project',
      rpcParams
    );

    if (rpcError) {
      console.error('Error in RPC call (create_new_project):', rpcError.message);
      console.error('Error details:', rpcError.details);
      return null;
    }

    // rpcResult (newProjectFromRpc) doğrudan Project objesi olmalı.
    if (!newProjectFromRpc || typeof newProjectFromRpc !== 'object' || !newProjectFromRpc.id) {
      console.error(
        'RPC call (create_new_project) did not return a valid project object with an ID.'
      );
      return null;
    }

    // RPC zaten güncel proje objesini döndürdüğü için getProjectById'a gerek yok.
    const newProject = newProjectFromRpc as Project; // Tip güvencesi için cast
    console.log(
      'RPC call (create_new_project) successful, new project:',
      newProject.name,
      'ID:',
      newProject.id
    );

    console.log('Project created successfully via RPC:', newProject.name);
    console.log('=== SERVER ACTION: createProject (v2 RPC) completed successfully ===');
    return newProject; // Doğrudan RPC'den dönen objeyi döndür
  } catch (error) {
    console.error('Unexpected error while creating project (v2 RPC):', error);
    console.log('=== SERVER ACTION: createProject (v2 RPC) completed with error ===');
    return null;
  }
}

/**
 * Function to delete a project
 * @param projectId ID of the project to delete
 * @returns Success status
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  console.log('=== SERVER ACTION: deleteProject started ===');
  console.log('Attempting to delete project with ID:', projectId);

  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_project', {
      p_project_id: projectId,
    });

    if (rpcError) {
      console.error('Error in RPC call (delete_project):', rpcError.message);
      console.error('Error details:', rpcError.details);
      return false;
    }

    // RPC'nin silinen proje ID'sini (string UUID) döndürmesi beklenir.
    // Eğer rpcResult bir string ise ve boş değilse, başarılı kabul edilir.
    if (typeof rpcResult === 'string' && rpcResult.length > 0) {
      console.log(`RPC call (delete_project) successful. Deleted project ID: ${rpcResult}`);
      console.log('=== SERVER ACTION: deleteProject completed successfully ===');
      return true;
    }

    console.error(
      'RPC call (delete_project) did not return a valid project ID string on success. Received:',
      rpcResult
    );
    console.log('=== SERVER ACTION: deleteProject completed with unexpected result ===');
    return false;
  } catch (error) {
    console.error('Unexpected error while deleting project:', error);
    console.log('=== SERVER ACTION: deleteProject completed with error ===');
    return false;
  }
}

/**
 * Function to update an existing project
 * @param projectId ID of the project to update
 * @param projectData Update data
 * @returns The updated project or null
 */
export async function updateProject(
  projectId: string,
  projectData: ProjectUpdatePayload
): Promise<Project | null> {
  try {
    /* console.log('=== SERVER ACTION: updateProject (v2 RPC) started ===');
    console.log(`Updating project ${projectId} with data:`, projectData); */

    // 1. Check user session (RPC'ler SECURITY DEFINER olduğu için aslında gerekmeyebilir)
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error(
        'Active session not found or error fetching session, project cannot be updated:',
        sessionError?.message
      );
      return null;
    }

    // 2. Call the RPC function update_project_details
    const rpcParams = {
      p_project_id: projectId,
      p_new_name: projectData.name,
      p_new_description: projectData.description,
      p_new_platform: projectData.platform,
      p_new_github_repo_url: projectData.github_repo_url,
      p_new_tags: projectData.tags,
      p_new_visibility: projectData.visibility,
      p_new_logo_url: projectData.logo_url,
      p_new_social_links: projectData.social_links,
    };
    /*  console.log('Calling RPC update_project_details with params:', rpcParams); */

    const { data: updatedProject, error: rpcError } = await supabase.rpc(
      'update_project_details',
      rpcParams
    );

    if (rpcError) {
      console.error('Error in RPC call (update_project_details):', rpcError.message);
      console.error('Error details:', rpcError.details);
      return null;
    }

    if (!updatedProject) {
      console.warn('RPC call (update_project_details) did not return the updated project.');
      // Depending on RPC spec, it might return void or a status. Assuming it returns the project object.
      // If not, we might need to call getProjectById here.
      return null;
    }

    /* console.log('Project updated successfully via RPC');
    console.log('=== SERVER ACTION: updateProject (v2 RPC) completed successfully ==='); */
    return updatedProject as Project; // Cast if RPC returns a generic object that matches Project
  } catch (error) {
    console.error('Unexpected error while updating project (v2 RPC):', error);
    console.log('=== SERVER ACTION: updateProject (v2 RPC) completed with error ===');
    return null;
  }
}

/**
 * Function to get the user's projects
 * @returns Array of projects or null
 */
// INFO: This function currently uses direct Supabase client queries as there's no specific RPC for it yet.
// Consider creating a get_projects_for_user RPC if finer-grained control or additional logic is needed.
export async function getUserProjects(): Promise<Project[] | null> {
  try {
    /* console.log('=== SERVER ACTION: getUserProjects started ==='); */

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      console.log('Active session not found');
      return [];
    }

    const userId = sessionData.session.user.id;

    const { data: projects, error } = await supabase
      .from('projects')
      .select(
        `
        *,
        owner_details:users ( id, fullname, avatar_url )
      `
      )
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      /* console.error('Error fetching projects:', error.message); */
      return [];
    }

    /*  console.log('Projects fetched successfully');
    console.log('=== SERVER ACTION: getUserProjects completed successfully ==='); */
    return projects;
  } catch (error) {
    console.error('Unexpected error while fetching projects:', error);
    console.log('=== SERVER ACTION: getUserProjects completed with error ===');
    return [];
  }
}

/**
 * Function to get a specific project
 * @param projectId Project ID
 * @returns Project or null
 */
// INFO: This function currently uses direct Supabase client queries as there's no specific RPC for it yet.
// Consider creating a get_project_details_by_id RPC if server-side logic/joins are complex.
export async function getProjectById(projectId: string): Promise<Project | null> {
  try {
    /* console.log('=== SERVER ACTION: getProjectById started ===');
    console.log('Project ID:', projectId); */

    // 0. Get current session for potential auth check later
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error fetching session:', sessionError.message);
      // Depending on policy, might return null or throw
      return null;
    }

    // 1. Fetch the relevant project and owner details
    const { data: project, error } = await supabase
      .from('projects')
      .select(
        `
        *,
        owner_details:users ( id, fullname, avatar_url )
      `
      )
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error fetching project:', error.message);
      return null;
    }

    if (!project) {
      console.log('Project not found');
      return null;
    }

    // 2. Authorization Check
    if (project.visibility === 'private') {
      if (!sessionData.session || sessionData.session.user.id !== project.owner_id) {
        console.warn(
          `Unauthorized attempt to access private project ${projectId} by user ${sessionData.session?.user?.id || 'unauthenticated'}`
        );
        return null; // Or throw new Error('Unauthorized');
      }
    }
    // For 'public' projects, RLS policies should handle if unauthenticated users can see them.
    // If session is required even for public projects, add: if (!sessionData.session) { return null; }

    /* console.log('Project fetched successfully and authorized'); */
    /* console.log('=== SERVER ACTION: getProjectById completed successfully ==='); */
    return project;
  } catch (error) {
    console.error('Unexpected error while fetching project:', error);
    console.log('=== SERVER ACTION: getProjectById completed with error ===');
    return null;
  }
}

/**
 * Function to get unique tags used in projects
 * @returns Promise<string[]> List of unique tags
 */
// INFO: This function currently uses direct Supabase client queries.
export async function getProjectTags(): Promise<string[]> {
  try {
    // Fetch projects
    const { data, error } = await supabase.from('projects').select('tags').not('tags', 'is', null);

    if (error || !data) {
      console.error('Error fetching tags:', error);
      return [];
    }

    // Flatten all project tags and make them unique
    const allTags: string[] = [];
    data.forEach((project) => {
      if (project.tags && Array.isArray(project.tags)) {
        allTags.push(...project.tags);
      }
    });

    // Return unique tags
    const uniqueTags = [...new Set(allTags)];
    return uniqueTags;
  } catch (error) {
    console.error('Unexpected error while fetching tags:', error);
    return [];
  }
}

/**
 * Function to get unique visibility values used in projects
 * @returns Promise<string[]> List of unique visibility values
 */
// INFO: This function currently uses direct Supabase client queries.
export async function getProjectVisibilities(): Promise<string[]> {
  try {
    // Fetch projects
    const { data, error } = await supabase
      .from('projects')
      .select('visibility')
      .not('visibility', 'is', null);

    if (error || !data) {
      console.error('Error fetching visibility values:', error);
      return [];
    }

    // Extract unique visibility values
    const visibilities = data.map((project) => project.visibility);
    const uniqueVisibilities = [...new Set(visibilities)];
    return uniqueVisibilities;
  } catch (error) {
    console.error('Unexpected error while fetching visibility values:', error);
    return [];
  }
}

/**
 * Function to update only the project visibility
 * @param projectId Project ID
 * @param visibility New visibility value
 * @returns The updated project or null
 */
export async function updateProjectVisibility(
  projectId: string,
  visibility: 'public' | 'private'
): Promise<Project | null> {
  try {
    console.log(`=== SERVER ACTION: updateProjectVisibility (v2 RPC) started ===`);
    console.log(`Updating visibility for project ${projectId} to ${visibility}`);

    // 1. Check user session (RPC'ler SECURITY DEFINER olduğu için aslında gerekmeyebilir)
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error(
        'Active session not found or error fetching session, project visibility cannot be updated:',
        sessionError?.message
      );
      return null;
    }

    // 2. Call the update_project_details RPC, only providing visibility
    const rpcParams = {
      p_project_id: projectId,
      p_new_visibility: visibility,
      // Diğer p_new_* alanları undefined/null olacak ve RPC'deki COALESCE sayesinde mevcut değerleri koruyacak.
      p_new_name: undefined,
      p_new_description: undefined,
      p_new_platform: undefined,
      p_new_github_repo_url: undefined,
      p_new_tags: undefined,
      p_new_logo_url: undefined,
      p_new_social_links: undefined,
    };
    console.log('Calling RPC update_project_details for visibility with params:', rpcParams);

    const { data: updatedProject, error: rpcError } = await supabase.rpc(
      'update_project_details',
      rpcParams
    );

    if (rpcError) {
      console.error('Error in RPC call (update_project_details for visibility):', rpcError.message);
      console.error('Error details:', rpcError.details);
      return null;
    }

    if (!updatedProject) {
      console.warn(
        'RPC call (update_project_details for visibility) did not return the updated project.'
      );
      return null;
    }

    /* console.log(`Project visibility updated successfully to ${visibility} via RPC`);
    console.log('=== SERVER ACTION: updateProjectVisibility (v2 RPC) completed successfully ==='); */
    return updatedProject as Project;
  } catch (error) {
    console.error('Unexpected error while updating project visibility (v2 RPC):', error);
    console.log('=== SERVER ACTION: updateProjectVisibility (v2 RPC) completed with error ===');
    return null;
  }
}
