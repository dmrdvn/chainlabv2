'use client';

import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type {
  ApiResponse,
  ProjectFile,
  ProjectFileEntry,
  ProjectHierarchyItem,
} from 'src/types/project';

import { supabase } from 'src/lib/supabase';

/**
 * Retrieves the entire file and directory hierarchy for a project.
 * This is used to build the file tree in the IDE.
 * RPC: get_project_hierarchy
 * @param projectId The ID of the project.
 * @returns An ApiResponse containing the list of project hierarchy items.
 */
export async function getProjectHierarchyAction(
  projectId: string
): Promise<ApiResponse<ProjectHierarchyItem[]>> {
  try {
    if (!projectId) {
      return { success: false, error: 'Invalid project ID.', data: null };
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      console.error('Session not found or error fetching session:', sessionError?.message);
      return { success: false, error: 'Authentication required.', data: null };
    }

    const { data, error: rpcError } = await supabase.rpc('get_project_hierarchy', {
      p_project_id: projectId,
    });

    if (rpcError) {
      console.error('RPC error (get_project_hierarchy):', rpcError.message, rpcError.details);
      return {
        success: false,
        error: rpcError.message || 'Failed to fetch project hierarchy.',
        data: null,
      };
    }

    /* console.log(`Project hierarchy fetched successfully for projectId: ${projectId}, items: ${data?.length || 0}`);
    console.log('=== ACTION: getProjectHierarchyAction completed successfully ==='); */
    return { success: true, data: data || [], error: undefined };
  } catch (error: any) {
    console.error('Unexpected error in getProjectHierarchyAction:', error);
    return {
      success: false,
      error: error.message || 'An unexpected server error occurred.',
      data: null,
    };
  }
}

/**
 * Proje dosyasını getiren fonksiyon
 * @param fileId Dosya ID
 * @returns Dosya içeriği
 */
export async function getProjectFile(fileId: string): Promise<ProjectFile | null> {
  try {
    if (!fileId) {
      console.error('Invalid file ID');
      return null;
    }

    // Check user session
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData?.session) {
      console.error('Session not found');
      return null;
    }

    const { data, error: rpcError } = await supabase
      .rpc('get_project_file_by_id', {
        p_file_id: fileId,
      })
      .maybeSingle();

    if (rpcError) {
      console.error('RPC call error (get_project_file_by_id):', rpcError.message);
      console.error('Error details:', rpcError.details);
      return null;
    }

    if (!data) {
      console.log('File not found or no content returned by ID:', fileId);
      return null;
    }

    /* console.log('File content retrieved successfully by ID:', fileId);
    console.log('=== SERVER ACTION: getProjectFile (by ID) completed successfully ==='); */
    return data as ProjectFile; // RPC'nin ProjectFile tipinde döndürdüğünü varsayıyoruz.
  } catch (error) {
    console.error('Unexpected error getting project file by ID:', error);
    console.log('=== SERVER ACTION: getProjectFile (by ID) completed with error ===');
    return null;
  }
}

// Payload for updating file content - MERGED
export interface UpdateFileContentActionPayload {
  fileId: string;
  newContent: string;
}

/**
 * Updates the content of any project file using its ID.
 * This function uses the `update_project_file_content` RPC.
 */
export async function updateFileContentAction({
  fileId,
  newContent,
}: UpdateFileContentActionPayload): Promise<{ success: boolean; message: string; data?: boolean }> {
  console.log(`=== ACTION: updateFileContentAction started for fileId: ${fileId} ===`);
  try {
    if (!fileId) {
      const errorMessage = 'File ID is required.';
      console.error(errorMessage);
      return { success: false, message: errorMessage };
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      const errorMessage =
        sessionError?.message || 'Authentication required to update file content.';
      console.error(errorMessage);
      return { success: false, message: errorMessage };
    }

    const { data, error: rpcError } = await supabase.rpc('update_project_file_content', {
      p_file_id: fileId,
      p_new_content: newContent,
    });

    if (rpcError) {
      console.error('RPC error (update_project_file_content):', rpcError.message);
      throw new Error(rpcError.message || 'Failed to update file content via RPC.');
    }

    if (data === true) {
      console.log(`=== ACTION: updateFileContentAction succeeded for fileId: ${fileId} ===`);
      return { success: true, message: 'File content updated successfully.', data: true };
    } else {
      console.warn(
        `=== ACTION: updateFileContentAction completed for fileId: ${fileId}, but RPC did not return true. Data:`,
        data
      );
      return {
        success: false,
        message: 'File content update did not confirm success.',
        data: false,
      };
    }
  } catch (error: any) {
    console.error(`=== ACTION: updateFileContentAction failed for fileId: ${fileId} ===`, error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred while updating file content.',
    };
  }
}

// --- File and Directory Management Actions (NEW) ---

export interface CreateFilePayload {
  projectId: string;
  filePath: string;
  content?: string; // Optional content
}

export interface CreateDirectoryPayload {
  projectId: string;
  directoryPath: string;
}

export interface RenameItemPayload {
  projectId: string;
  currentPath: string;
  newPath: string;
}

export interface DeleteItemPayload {
  projectId: string;
  itemPath: string;
}

// Helper function to extract file or directory name from a path
function extractNameFromPath(path: string): string {
  if (!path) return '';
  const parts = path.split('/');
  return parts[parts.length - 1] || '';
}

// Internal helper function for adding a file or directory
async function _addProjectItemInternal(
  projectId: string,
  filePath: string,
  fileName: string,
  content: string | null,
  isDir: boolean
): Promise<ApiResponse<{ item_id: string }>> {
  console.log(
    `=== INTERNAL: _addProjectItemInternal for ${isDir ? 'directory' : 'file'}: ${filePath} in projectId: ${projectId} ===`
  );
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      return { success: false, error: 'Authentication required.', data: null };
    }

    const rpcParams = {
      p_project_id: projectId,
      p_file_path: filePath,
      p_file_name: fileName,
      p_content: content,
      p_is_directory: isDir,
    };

    console.log(
      `Calling RPC add_project_file_or_directory for ${isDir ? 'directory' : 'file'} with params:`,
      rpcParams
    );
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'add_project_file_or_directory',
      rpcParams
    );

    if (rpcError) {
      console.error(
        `RPC error (add_project_file_or_directory for ${isDir ? 'directory' : 'file'}):`,
        rpcError.message,
        rpcError.details
      );
      return {
        success: false,
        error: rpcError.message || `Failed to create ${isDir ? 'directory' : 'file'}.`,
        data: null,
      };
    }

    console.log(`${isDir ? 'Directory' : 'File'} entry created successfully, ID:`, rpcData);
    return { success: true, data: { item_id: rpcData as string } };
  } catch (error: any) {
    console.error(
      `Unexpected error in _addProjectItemInternal for ${isDir ? 'directory' : 'file'}:`,
      error
    );
    return {
      success: false,
      error: error.message || 'An unexpected server error occurred.',
      data: null,
    };
  }
}

/**
 * Creates a new file in a project.
 * RPC: add_project_file_or_directory
 */
export async function createProjectFileAction(
  payload: CreateFilePayload
): Promise<ApiResponse<{ file_id: string }>> {
  console.log(
    `=== ACTION: createProjectFileAction started for path: ${payload.filePath} in projectId: ${payload.projectId} ===`
  );
  const result = await _addProjectItemInternal(
    payload.projectId,
    payload.filePath,
    extractNameFromPath(payload.filePath),
    payload.content ?? null,
    false
  );
  if (result.success && result.data) {
    return { success: true, data: { file_id: result.data.item_id }, error: undefined };
  }
  // Return the error directly if not successful or data is null
  return { success: false, error: result.error, data: null };
}

/**
 * Creates a new directory in a project.
 * RPC: add_project_file_or_directory
 */
export async function createProjectDirectoryAction(
  payload: CreateDirectoryPayload
): Promise<ApiResponse<{ directory_id: string }>> {
  console.log(
    `=== ACTION: createProjectDirectoryAction for path: ${payload.directoryPath} in projectId: ${payload.projectId} ===`
  );
  const result = await _addProjectItemInternal(
    payload.projectId,
    payload.directoryPath,
    extractNameFromPath(payload.directoryPath),
    null, // Directories have no content
    true
  );
  if (result.success && result.data) {
    return { success: true, data: { directory_id: result.data.item_id }, error: undefined };
  }
  // Return the error directly if not successful or data is null
  return { success: false, error: result.error, data: null };
}

/**
 * Renames a file or directory in a project.
 * RPC: rename_project_file_or_directory
 */
export async function renameProjectItemAction(
  payload: RenameItemPayload
): Promise<ApiResponse<any>> {
  // RPC might return void or simple success
  console.log(
    `=== ACTION: renameProjectItemAction for path: ${payload.currentPath} to ${payload.newPath} in projectId: ${payload.projectId} ===`
  );
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      return { success: false, error: 'Authentication required.', data: null };
    }

    const rpcParams = {
      p_project_id: payload.projectId,
      p_current_path: payload.currentPath,
      p_new_path: payload.newPath,
    };
    console.log('Calling RPC rename_project_file_or_directory with params:', rpcParams);

    const { data, error: rpcError } = await supabase.rpc(
      'rename_project_file_or_directory',
      rpcParams
    );

    if (rpcError) {
      console.error(
        'RPC error (rename_project_file_or_directory):',
        rpcError.message,
        rpcError.details
      );
      return { success: false, error: rpcError.message || 'Failed to rename item.', data: null };
    }
    // Assuming RPC returns simple success like { success: true, message: '...' } or void
    console.log('Item renamed successfully:', data);
    return { success: true, data: data || { message: 'Item renamed successfully.' } };
  } catch (error: any) {
    console.error('Unexpected error in renameProjectItemAction:', error);
    return {
      success: false,
      error: error.message || 'An unexpected server error occurred.',
      data: null,
    };
  }
}

/**
 * Deletes a file or directory in a project.
 * RPC: delete_project_file_or_directory
 */
export async function deleteProjectItemAction(
  payload: DeleteItemPayload
): Promise<ApiResponse<any>> {
  // RPC might return void or simple success
  console.log(
    `=== ACTION: deleteProjectItemAction for path: ${payload.itemPath} in projectId: ${payload.projectId} ===`
  );
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      return { success: false, error: 'Authentication required.', data: null };
    }

    const rpcParams = {
      p_project_id: payload.projectId,
      p_path: payload.itemPath, // Changed p_item_path to p_path
    };
    console.log('Calling RPC delete_project_file_or_directory with params:', rpcParams);

    const { data, error: rpcError } = await supabase.rpc(
      'delete_project_file_or_directory',
      rpcParams
    );

    if (rpcError) {
      console.error(
        'RPC error (delete_project_file_or_directory):',
        rpcError.message,
        rpcError.details
      );
      return { success: false, error: rpcError.message || 'Failed to delete item.', data: null };
    }
    // Assuming RPC returns simple success like { success: true, message: '...' } or void
    console.log('Item deleted successfully:', data);
    return { success: true, data: data || { message: 'Item deleted successfully.' } };
  } catch (error: any) {
    console.error('Unexpected error in deleteProjectItemAction:', error);
    return {
      success: false,
      error: error.message || 'An unexpected server error occurred.',
      data: null,
    };
  }
}

export async function getProjectEvmContractsAction(
  projectId: string
): Promise<ApiResponse<ProjectHierarchyItem[]>> {
  console.log(`=== ACTION: getProjectEvmContractsAction started for projectId: ${projectId} ===`);
  try {
    if (!projectId) {
      return { success: false, error: 'Invalid project ID.', data: null };
    }

    // Opsiyonel: Oturum kontrolü
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      return { success: false, error: 'Authentication required.', data: null };
    }

    const { data, error: rpcError } = await supabase.rpc('get_project_evm_contracts', {
      p_project_id: projectId,
    });

    console.log('RPC (get_project_evm_contracts) raw data:', data);

    if (rpcError) {
      console.error('RPC error (get_project_evm_contracts):', rpcError.message);
      return {
        success: false,
        error: rpcError.message || 'Failed to fetch EVM contracts.',
        data: null,
      };
    }

    // RPC'den dönen json[] verisini ProjectHierarchyItem[] olarak cast ediyoruz.
    // Supabase RPC'leri json döndürdüğünde, data zaten parse edilmiş bir dizi olacaktır.
    const contracts = (data || []) as ProjectHierarchyItem[];

    console.log(
      `EVM contracts fetched successfully for projectId: ${projectId}, items: ${contracts.length}`
    );
    return { success: true, data: contracts, error: undefined };
  } catch (error: any) {
    console.error('Unexpected error in getProjectEvmContractsAction:', error);
    return {
      success: false,
      error: error.message || 'An unexpected server error occurred.',
      data: null,
    };
  }
}

export async function getProjectSolanaProgramsAction(
  projectId: string
): Promise<ApiResponse<ProjectHierarchyItem[]>> {
  console.log(`=== ACTION: getProjectSolanaProgramsAction started for projectId: ${projectId} ===`);
  try {
    if (!projectId) {
      return { success: false, error: 'Invalid project ID.', data: null };
    }

    // Opsiyonel: Oturum kontrolü
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      return { success: false, error: 'Authentication required.', data: null };
    }

    const { data, error: rpcError } = await supabase.rpc('get_project_solana_programs', {
      p_project_id: projectId,
    });

    console.log('RPC (get_project_solana_programs) raw data:', data);

    if (rpcError) {
      console.error('RPC error (get_project_solana_programs):', rpcError.message);
      return {
        success: false,
        error: rpcError.message || 'Failed to fetch Solana programs.',
        data: null,
      };
    }

    // RPC'den dönen json[] verisini ProjectHierarchyItem[] olarak cast ediyoruz.
    // Supabase RPC'leri json döndürdüğünde, data zaten parse edilmiş bir dizi olacaktır.
    const programs = (data || []) as ProjectHierarchyItem[];

    console.log(
      `Solana programs fetched successfully for projectId: ${projectId}, items: ${programs.length}`
    );
    return { success: true, data: programs, error: undefined };
  } catch (error: any) {
    console.error('Unexpected error in getProjectSolanaProgramsAction:', error);
    return {
      success: false,
      error: error.message || 'An unexpected server error occurred.',
      data: null,
    };
  }
}

/**
 * Projeye ait frontendleri getiren fonksiyon
 * @param projectId Proje ID
 * @returns Frontend projeleri listesi
 */
export async function getProjectFrontends(projectId: string) {
  try {
    console.log('=== SERVER ACTION: getProjectFrontends started ===');
    console.log('Project ID:', projectId);

    if (!projectId) {
      console.error('Invalid project ID');
      return null;
    }

    // Check user session
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData?.session) {
      console.error('Session not found');
      return null;
    }

    // Call RPC function
    const { data, error: rpcError } = await supabase.rpc('get_project_frontends', {
      p_project_id: projectId,
    });

    if (rpcError) {
      console.error('RPC call error:', rpcError.message);
      console.error('Error details:', rpcError.details);
      return null;
    }

    console.log(`${data?.length || 0} frontend project(s) found`);
    console.log('=== SERVER ACTION: getProjectFrontends completed successfully ===');
    return data || null;
  } catch (error) {
    console.error('Unexpected error getting frontend projects:', error);
    console.log('=== SERVER ACTION: getProjectFrontends completed with error ===');
    return null;
  }
}

// --- EVM Contract File Creation ---

/**
 * Payload for creating new EVM contract files.
 */
export interface CreateNewEvmContractFilesPayload {
  projectId: string;
  contractName: string; // PascalCase
}

export interface CreateNewSolanaProgramFilesPayload {
  projectId: string;
  programName: string; // snake_case olmalı (RPC bunu bekliyor olabilir, kontrol et)
  programIdStr: string; // YENİ: Frontend'den gelen Program ID (Base58)
  keypairJsonContent: string; // YENİ: Frontend'den gelen Keypair JSON içeriği
}

/**
 * Response type for createNewEvmContractFilesAction,
 * assuming RPC returns an array of created file entries.
 */
export type CreateNewEvmContractFilesResponse = ProjectFileEntry[];
export type CreateNewSolanaProgramFilesResponse = ProjectFileEntry[];

/**
 * Calls the 'create_new_evm_contract' RPC to create standard contract, test, and script files
 * for a new EVM contract within a project.
 *
 * @param payload - Contains projectId and the desired contractName.
 * @returns An ApiResponse containing the list of created project file entries.
 */
export async function createNewEvmContractFilesAction(
  payload: CreateNewEvmContractFilesPayload
): Promise<ApiResponse<CreateNewEvmContractFilesResponse>> {
  console.log(
    `=== ACTION: createNewEvmContractFilesAction started for projectId: ${payload.projectId}, contractName: ${payload.contractName} ===`
  );
  try {
    if (!payload.projectId || !payload.contractName) {
      const errorMessage =
        'Invalid parameters for createNewEvmContractFilesAction. ProjectId and ContractName are required.';
      console.error(errorMessage);
      return { success: false, error: errorMessage, data: null };
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      console.error('Session not found or error fetching session:', sessionError?.message);
      return { success: false, error: 'Authentication required.', data: null };
    }
    console.log('User session validated.');

    const rpcParams = {
      p_project_id: payload.projectId,
      p_contract_name: payload.contractName,
    };
    console.log('Calling RPC create_new_evm_contract with params:', rpcParams);

    const { data, error: rpcError } = await supabase.rpc('create_new_evm_contract', rpcParams);

    if (rpcError) {
      console.error('RPC error (create_new_evm_contract):', rpcError.message, rpcError.details);
      return {
        success: false,
        error: rpcError.message || 'Failed to create EVM contract files via RPC.',
        data: null,
      };
    }

    console.log(
      `EVM contract files created successfully for ${payload.contractName}. Response data:`,
      data
    );
    console.log('=== ACTION: createNewEvmContractFilesAction completed successfully ===');
    return {
      success: true,
      data: (data as CreateNewEvmContractFilesResponse) || [],
      error: undefined,
    };
  } catch (error: any) {
    console.error('Unexpected error in createNewEvmContractFilesAction:', error);
    return {
      success: false,
      error:
        error.message || 'An unexpected server error occurred while creating EVM contract files.',
      data: null,
    };
  }
}

/**
 * Calls the 'create_new_solana_program' RPC to create standard contract, test, and script files
 * for a new Solana program within a project.
 *
 * @param payload - Contains projectId, programName, programIdStr, and keypairJsonContent.
 * @returns An ApiResponse containing the list of created project file entries.
 */
export async function createNewSolanaProgramFilesAction(
  payload: CreateNewSolanaProgramFilesPayload
): Promise<ApiResponse<CreateNewSolanaProgramFilesResponse>> {
  console.log(
    `=== ACTION: createNewSolanaProgramFilesAction for program: ${payload.programName}, projectId: ${payload.projectId} ===`
  );
  console.log('Full payload:', payload); // Log the full payload to see new params

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      console.error('Session not found or error fetching session:', sessionError?.message);
      return { success: false, error: 'Authentication required.', data: null };
    }

    const rpcParams = {
      p_project_id: payload.projectId,
      p_program_name: payload.programName,
      p_program_id_str: payload.programIdStr, // YENİ
      p_keypair_json_content: payload.keypairJsonContent, // YENİ
    };

    console.log('Calling RPC create_new_solana_program with params:', rpcParams);

    const { data: newFiles, error: rpcError } = await supabase.rpc(
      'create_new_solana_program',
      rpcParams
    );

    if (rpcError) {
      console.error(
        'RPC error (create_new_solana_program):',
        rpcError.message,
        rpcError.details,
        rpcError.hint
      );
      return {
        success: false,
        error: rpcError.message || 'Failed to create Solana program files.',
        data: null,
      };
    }

    if (!newFiles || newFiles.length === 0) {
      console.warn(
        'createNewSolanaProgramFilesAction: RPC returned no files or empty array. This might be an issue if files were expected.'
      );
      // Return success with empty data if RPC didn't error but returned nothing, or handle as error
      // For now, let's assume it means no new files were meant to be listed, or an issue occurred.
      // Depending on RPC behavior, this might need to be treated as an error.
      return { success: true, data: [], error: undefined };
    }

    console.log(
      `Solana program files created/updated successfully for program: ${payload.programName}, files count: ${newFiles.length}`
    );
    console.log('=== ACTION: createNewSolanaProgramFilesAction completed successfully ===');
    return { success: true, data: newFiles, error: undefined };
  } catch (error: any) {
    console.error('Unexpected error in createNewSolanaProgramFilesAction:', error);
    return {
      success: false,
      error:
        error.message || 'An unexpected server error occurred while creating Solana program files.',
      data: null,
    };
  }
}

// Types for RequestCompilation
export interface RequestCompilationPayload {
  projectId: string;
  userId: string;
  compilerVersion?: string;
  currentFile?: string;
  targetVersion?: string; // Yeni eklendi (örn: EVM versiyonu 'london', 'paris')
  optimizerSettings?:
    | {
        // Yeni eklendi (örn: { enabled: true, runs: 200 })
        enabled: boolean;
        runs?: number; // Solidity optimizer için 'runs' tipik bir ayardır
        // Diğer platformlar için farklı ayarlar olabilir
      }
    | Record<string, any>; // Daha genel bir tip de olabilir
}

export interface RequestCompilationResponse {
  compilation_id: string;
  project_id: string;
  project_version_id: string;
  current_file?: string;
  status: 'queued';
  requested_at: string;
}

/**
 * Requests a new compilation for a project.
 * Calls the 'request_compilation' RPC function.
 *
 * @param payload - Contains projectId, userId, compilerVersion (optional), and currentFile (optional).
 * @returns An ApiResponse containing the details of the queued compilation.
 */
export async function requestCompilationAction(
  payload: RequestCompilationPayload
): Promise<ApiResponse<RequestCompilationResponse>> {
  /* console.log(
    `=== ACTION: requestCompilationAction started for projectId: ${payload.projectId}, userId: ${payload.userId} ===`
  ); */
  try {
    if (!payload.projectId || !payload.userId) {
      const errorMessage =
        'Invalid parameters for requestCompilationAction. ProjectId and UserId are required.';
      console.error(errorMessage);
      return { success: false, error: errorMessage, data: null };
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      console.error('Session not found or error fetching session:', sessionError?.message);
      return { success: false, error: 'Authentication required.', data: null };
    }
    if (sessionData.session.user.id !== payload.userId) {
      console.warn(
        `Security Alert: Authenticated user ${sessionData.session.user.id} is requesting compilation for user ${payload.userId}. Allowing for now, but review security implications.`
      );
    }

    const rpcParams = {
      p_project_id: payload.projectId,
      p_user_id: payload.userId,
      p_compiler_version: payload.compilerVersion,
      p_current_file: payload.currentFile,
      p_target_version: payload.targetVersion, // Yeni eklendi
      p_optimizer_settings: payload.optimizerSettings, // Yeni eklendi
    };
    /*  console.log('Calling RPC request_compilation with params:', rpcParams); */

    const { data, error: rpcError } = await supabase.rpc('request_compilation', rpcParams);

    if (rpcError) {
      console.error('RPC error (request_compilation):', rpcError.message, rpcError.details);
      return {
        success: false,
        error: rpcError.message || 'Failed to request compilation via RPC.',
        data: null,
      };
    }

    if (!data) {
      console.error('RPC (request_compilation) returned no data.');
      return {
        success: false,
        error: 'RPC returned no data for compilation request.',
        data: null,
      };
    }

    /* console.log(
      `Compilation requested successfully for projectId: ${payload.projectId}. Response data:`, data
    ); */
    console.log('=== ACTION: requestCompilationAction completed successfully ===');
    return { success: true, data: data as RequestCompilationResponse, error: undefined };
  } catch (error: any) {
    console.error('Unexpected error in requestCompilationAction:', error);
    return {
      success: false,
      error: error.message || 'An unexpected server error occurred while requesting compilation.',
      data: null,
    };
  }
}

// --- Realtime Subscription for Compilations ---

// Interface for the Compilation table row
export interface Compilation {
  id: string; // uuid
  project_id: string; // uuid
  project_version_id: string; // uuid
  user_id: string; // uuid
  requested_at?: string | null; // timestamp with time zone
  started_at?: string | null; // timestamp with time zone
  completed_at?: string | null; // timestamp with time zone
  status: 'queued' | 'processing' | 'success' | 'error'; // text
  worker_id?: string | null; // text
  compiler_version?: string | null; // text
  artifacts?: Record<string, any> | null; // jsonb
  logs?: string | null; // text
  error_message?: string | null; // text
  updated_at?: string | null; // timestamp with time zone
  target_version?: string | null; // text
  optimizer_settings?: Record<string, any> | null; // jsonb
}

/**
 * Subscribes to real-time changes in the 'compilations' table for a specific project.
 *
 * @param projectId The ID of the project to filter compilations by.
 * @param callback A function to be called when a change occurs.
 *                 It receives the payload of the change.
 * @returns The RealtimeChannel for this subscription, allowing to unsubscribe later.
 */
export function subscribeToCompilationsByProject(
  projectId: string,
  callback: (payload: RealtimePostgresChangesPayload<Compilation>) => void
): RealtimeChannel {
  console.log(`=== ACTION: Subscribing to compilations for project: ${projectId} ===`);

  const channel = supabase
    .channel(`project-compilations-${projectId}`) // Unique channel name per project
    .on<Compilation>(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'compilations',
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => {
        callback(payload);
      }
    );
  // .subscribe() status listener'ı buradan kaldırıldı. Hook kendi status listener'ını kullanacak.

  return channel;
}

// --- End of Realtime Subscription for Compilations ---
