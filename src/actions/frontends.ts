'use client';

import type { Frontend } from 'src/types/frontend';

import { supabase } from 'src/lib/supabase';

/**
 * Belirli bir projenin frontend'lerini getiren fonksiyon
 * @param projectId Proje ID
 * @returns Frontend listesi
 */
export async function getFrontendsByProjectId(projectId: string): Promise<Frontend[]> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return [];
    }

    // Kullanıcının belirtilen projeye erişim yetkisi olup olmadığını kontrol et
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();

    if (!project || project.owner_id !== session.user.id) {
      // TODO: İleride collaborator kontrolü eklenebilir
      console.error('You do not have permission to access this project');
      return [];
    }

    // Fetch frontends belonging to the project
    const { data, error } = await supabase
      .from('frontends')
      .select('*')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching frontends:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching frontends:', error);
    return [];
  }
}

/**
 * ID'ye göre frontend detayını getiren fonksiyon
 * @param frontendId Frontend ID
 * @returns Frontend detayı veya null
 */
export async function getFrontendById(frontendId: string): Promise<Frontend | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error('Active session not found!');
      return null;
    }

    const { data, error } = await supabase
      .from('frontends')
      .select('*, projects!inner(owner_id)')
      .eq('id', frontendId)
      .single();

    if (error) {
      console.error('Error fetching frontend details:', error);
      return null;
    }

    // Check if the user is the owner of the project
    if (data.projects.owner_id !== session?.user?.id) {
      // TODO: İleride collaborator kontrolü eklenebilir
      console.error('You do not have permission to access this frontend');
      return null;
    }

    // Clean up the `projects` reference
    const { projects, ...frontendData } = data;
    return frontendData as Frontend;
  } catch (error) {
    console.error('Unexpected error fetching frontend details:', error);
    return null;
  }
}

/**
 * Yeni frontend oluşturan fonksiyon
 * @param frontendData Frontend verileri
 * @returns Oluşturulan frontend veya null
 */
export async function createFrontend(frontendData: Partial<Frontend>): Promise<Frontend | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error('Active session not found!');
      return null;
    }

    // Check if the user has permission to access the specified project
    if (frontendData.project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', frontendData.project_id)
        .single();

      if (!project || project.owner_id !== session?.user?.id) {
        console.error('You do not have permission to add a frontend to this project');
        return null;
      }
    }

    const { data, error } = await supabase.from('frontends').insert(frontendData).select().single();

    if (error) {
      console.error('Error creating frontend:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error creating frontend:', error);
    return null;
  }
}
