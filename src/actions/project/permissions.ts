'use client';

import { supabase } from 'src/lib/supabase';

/**
 * Rol tanımını alır
 * @param flags İzin flag'leri
 * @returns Rol adı ve açıklaması
 */
export function getRoleDefinition(flags: string[]) {
  // Varsayılan roller ve karşılık gelen izinleri tanımla
  const roles = {
    owner: {
      name: 'Project Owner',
      description: 'Full access to all project features',
      flags: [
        'can_view',
        'can_edit',
        'can_delete',
        'can_invite',
        'can_remove_members',
        'can_manage_permissions',
      ],
    },
    admin: {
      name: 'Administrator',
      description: 'Can manage project and members',
      flags: ['can_view', 'can_edit', 'can_invite', 'can_remove_members'],
    },
    editor: {
      name: 'Editor',
      description: 'Can edit project content',
      flags: ['can_view', 'can_edit'],
    },
    viewer: {
      name: 'Viewer',
      description: 'Can only view project content',
      flags: ['can_view'],
    },
  };

  // İzin flag'leri verilmezse varsayılan "Viewer" izinlerini kullan
  if (!flags || !Array.isArray(flags) || flags.length === 0) {
    return roles.viewer;
  }

  // İzinlere göre rol belirle
  const hasAllPermissions = (roleFlags: string[]) =>
    roleFlags.every((flag) => flags.includes(flag));

  // En yüksek rolden başlayarak aşağı doğru kontrol et
  if (hasAllPermissions(roles.owner.flags)) {
    return roles.owner;
  } else if (hasAllPermissions(roles.admin.flags)) {
    return roles.admin;
  } else if (hasAllPermissions(roles.editor.flags)) {
    return roles.editor;
  } else {
    return {
      name: 'Custom Role',
      description: 'Custom permission set',
      flags,
    };
  }
}

/**
 * Sistemdeki tüm izinleri getiren fonksiyon
 * @returns İzinlerin listesi
 */
export async function getPermissions() {
  try {
    // Sabit izin listesi - veritabanından çekmek yerine sabit liste kullanılıyor
    const permissions = [
      {
        id: 'can_view',
        name: 'View',
        description: 'Permission to view project content',
        category: 'basic',
      },
      {
        id: 'can_edit',
        name: 'Edit',
        description: 'Permission to edit project content',
        category: 'basic',
      },
      {
        id: 'can_delete',
        name: 'Delete',
        description: 'Permission to delete project content',
        category: 'advanced',
      },
      {
        id: 'can_invite',
        name: 'Invite',
        description: 'Permission to invite new members to the project',
        category: 'member_management',
      },
      {
        id: 'can_remove_members',
        name: 'Remove Members',
        description: 'Permission to remove members from the project',
        category: 'member_management',
      },
      {
        id: 'can_manage_permissions',
        name: 'Manage Permissions',
        description: "Permission to manage other members' permissions",
        category: 'admin',
      },
    ];

    return permissions;
  } catch (error) {
    console.error('Permissions could not be retrieved:', error);
    return [];
  }
}

/**
 * Proje üyesinin izinlerini kontrol eden fonksiyon
 * @param userIdOrEmail Kullanıcı ID veya e-posta
 * @param projectId Proje ID
 * @param permission Kontrol edilecek izin
 * @returns İzin var mı?
 */
export async function checkPermission(
  userIdOrEmail: string,
  projectId: string,
  permission: string
): Promise<boolean> {
  try {
    console.log('=== SERVER ACTION: checkPermission started ===');
    console.log('userIdOrEmail:', userIdOrEmail);
    console.log('projectId:', projectId);
    console.log('permission:', permission);

    if (!userIdOrEmail || !projectId || !permission) {
      console.error('Missing parameters, permission check cannot be performed');
      return false;
    }

    // 1. Kullanıcı oturumunu kontrol et
    const { data: sessionData } = await supabase.auth.getSession();

    // Oturum yoksa izin yok
    if (!sessionData?.session?.user) {
      console.error('Active session not found');
      return false;
    }

    const currentUserId = sessionData.session.user.id;

    // 2. Kullanıcı ID'sini belirle (userIdOrEmail e-posta olabilir)
    let userId = userIdOrEmail;
    if (userIdOrEmail.includes('@')) {
      // E-posta ise, kullanıcı ID'sini bul
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', userIdOrEmail)
        .maybeSingle();

      if (!userData) {
        console.error('User not found');
        return false;
      }
      userId = userData.id;
    }

    // 3. RPC fonksiyonunu çağır
    const { data: hasPermission, error: rpcError } = await supabase.rpc('check_user_permission', {
      p_user_id: userId,
      p_project_id: projectId,
      p_permission: permission,
    });

    if (rpcError) {
      console.error('RPC call failed:', rpcError.message);
      console.error('Error details:', rpcError.details);
      return false;
    }

    console.log('Permission check result:', hasPermission ? 'Permission granted' : 'Permission denied');
    console.log('=== SERVER ACTION: checkPermission completed successfully ===');
    return !!hasPermission;
  } catch (error) {
    console.error('Unexpected error during permission check:', error);
    console.log('=== SERVER ACTION: checkPermission completed with error ===');
    return false;
  }
}

/**
 * Kullanıcının bir projedeki tüm izinlerini getiren fonksiyon
 * @param userId Kullanıcı ID
 * @param projectId Proje ID
 * @returns İzin listesi ve diğer detaylar
 */
export async function getUserProjectPermissions(userId: string, projectId: string) {
  try {
    console.log('=== SERVER ACTION: getUserProjectPermissions started ===');
    console.log('userId:', userId);
    console.log('projectId:', projectId);

    if (!userId || !projectId) {
      console.error('Invalid userId or projectId');
      return null;
    }

    // RPC fonksiyonunu çağır
    const { data: permissions, error: rpcError } = await supabase.rpc(
      'get_user_project_permissions',
      {
        p_user_id: userId,
        p_project_id: projectId,
      }
    );

    if (rpcError) {
      console.error('RPC call failed:', rpcError.message);
      console.error('Error details:', rpcError.details);
      return null;
    }

    if (!permissions || permissions.length === 0) {
      console.log('User has no permissions for this project');
      return {
        is_owner: false,
        all_permissions: [],
        custom_flags: [],
        base_role: 'none',
      };
    }

    const permissionData = permissions[0];

    // İzinlerin rolünü belirle
    const roleInfo = getRoleDefinition(permissionData.all_permissions || []);

    const result = {
      is_owner: permissionData.is_owner,
      all_permissions: permissionData.all_permissions || [],
      custom_flags: permissionData.custom_flags || [],
      base_role: permissionData.base_role || roleInfo.name.toLowerCase().replace(' ', '_'),
      member_id: permissionData.member_id,
    };

    console.log('User permissions retrieved successfully');
    console.log('=== SERVER ACTION: getUserProjectPermissions completed successfully ===');
    return result;
  } catch (error) {
    console.error('Unexpected error during user permission retrieval:', error);
    console.log('=== SERVER ACTION: getUserProjectPermissions completed with error ===');
    return null;
  }
}

/**
 * Proje üyesinin izinlerini güncelle
 * @param projectId Proje ID'si
 * @param memberId Üye ID'si
 * @param permissions İzin flag'leri
 * @returns Güncelleme sonucu
 */
export async function updateMemberPermissions(
  projectId: string,
  memberId: string,
  permissions: string[]
) {
  try {
    console.log('=== SERVER ACTION: updateMemberPermissions started ===');
    console.log('projectId:', projectId);
    console.log('memberId:', memberId);
    console.log('permissions:', permissions);

    // 1. Kullanıcı oturumunu kontrol et
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData?.session?.user?.id) {
      console.error('Session not found');
      return { success: false, error: 'Session not found' };
    }

    const currentUserId = sessionData.session.user.id;

    // 2. RPC fonksiyonunu çağır
    const { data: result, error: rpcError } = await supabase.rpc('update_member_permissions', {
      p_project_id: projectId,
      p_member_id: memberId,
      p_user_id: currentUserId,
      p_permissions: permissions,
    });

    if (rpcError) {
      console.error('RPC call failed:', rpcError.message);
      console.error('Error details:', rpcError.details);
      return {
        success: false,
        error: rpcError.message,
      };
    }

    if (!result || result.length === 0 || !result[0].success) {
      const errorMessage = result && result[0] ? result[0].message : 'Permissions could not be updated';
      console.error('Permission update failed:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }

    console.log('Permissions updated successfully');
    console.log('=== SERVER ACTION: updateMemberPermissions completed successfully ===');
    return {
      success: true,
      data: {
        id: result[0].member_id,
        custom_flags: result[0].permissions,
      },
    };
  } catch (error: any) {
    console.error('Unexpected error during permission update:', error);
    console.log('=== SERVER ACTION: updateMemberPermissions completed with error ===');
    return { success: false, error: error.message || 'An unknown error occurred' };
  }
}
