'use client';

import { useState } from 'react';

// Flag sabitlerini tanımla
// Aynı flag sabitleri proje genelinde kullanılacak
export const PERMISSION_FLAGS = {
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_CONTRACTS: 'view_contracts',
  EDIT_CONTRACT: 'edit_contract',
  DEPLOY_CONTRACT: 'deploy_contract',
  VIEW_FRONTENDS: 'view_frontends',
  EDIT_FRONTEND: 'edit_frontend',
  DEPLOY_FRONTEND: 'deploy_frontend',
  MANAGE_TEAM: 'manage_team',
  MANAGE_PAYMENTS: 'manage_payments',
};

// API dönüşü için izin tanımı
export type Permission = {
  id: string;
  flag: string;
  name: string;
  description: string;
};

// Kullanıcının oluşturacağı rol tipi
export type CustomRole = {
  name: string;
  description: string;
  flags: string[];
};

/**
 * Tüm kullanılabilir izin flag'larını getiren hook
 * @returns Flag listesi ve durumlar
 */
export function usePermissionFlags() {
  // Flag'lara karşılık gelen kullanıcı dostu açıklamalar
  const flagsWithLabels = [
    {
      flag: PERMISSION_FLAGS.VIEW_DASHBOARD,
      name: 'Dashboard View',
      description: "Proje dashboard'unu görüntüleyebilir",
    },
    {
      flag: PERMISSION_FLAGS.VIEW_CONTRACTS,
      name: 'Contract View',
      description: 'Has view contracts',
    },
    {
      flag: PERMISSION_FLAGS.EDIT_CONTRACT,
      name: 'Contract Edit',
      description: 'Has edit contracts',
    },
    {
      flag: PERMISSION_FLAGS.DEPLOY_CONTRACT,
      name: 'Contract Deploy',
      description: 'Has deploy contracts',
    },
    {
      flag: PERMISSION_FLAGS.VIEW_FRONTENDS,
      name: 'Frontend View',
      description: 'Has view frontends',
    },
    {
      flag: PERMISSION_FLAGS.EDIT_FRONTEND,
      name: 'Frontend Edit',
      description: 'Has edit frontends',
    },
    {
      flag: PERMISSION_FLAGS.DEPLOY_FRONTEND,
      name: 'Frontend Deploy',
      description: 'Has deploy frontends',
    },
    {
      flag: PERMISSION_FLAGS.MANAGE_TEAM,
      name: 'Team Management',
      description: 'Has manage the project team, add and remove members',
    },
    {
      flag: PERMISSION_FLAGS.MANAGE_PAYMENTS,
      name: 'Payment Management',
      description: 'Has payment management',
    },
  ];

  return {
    flags: flagsWithLabels,
    allFlags: Object.values(PERMISSION_FLAGS),
  };
}

/**
 * Rol oluşturmak için kullanılacak form hook'u
 * @returns Form yönetim fonksiyonları
 */
export function useRoleForm(initialRole?: CustomRole) {
  const [role, setRole] = useState<CustomRole>(
    initialRole || {
      name: '',
      description: '',
      flags: [],
    }
  );

  const updateRoleName = (name: string) => {
    setRole((prev) => ({ ...prev, name }));
  };

  const updateRoleDescription = (description: string) => {
    setRole((prev) => ({ ...prev, description }));
  };

  const updateRoleFlags = (flags: string[]) => {
    setRole((prev) => ({ ...prev, flags }));
  };

  const toggleFlag = (flag: string, enabled: boolean) => {
    if (enabled && !role.flags.includes(flag)) {
      updateRoleFlags([...role.flags, flag]);
    } else if (!enabled && role.flags.includes(flag)) {
      updateRoleFlags(role.flags.filter((f) => f !== flag));
    }
  };

  const resetRole = () => {
    setRole({
      name: '',
      description: '',
      flags: [],
    });
  };

  // Hazır rol şablonları
  const applyTemplate = (template: 'viewer' | 'editor' | 'admin') => {
    // Hook içinde başka hook çağıramayız, o yüzden bunu yukarıda tanımlayalım
    // const { flags } = usePermissionFlags(); -> hatalı kullanım

    // Flagları burada manuel olarak tanımlayalım
    const viewerFlags = Object.values(PERMISSION_FLAGS).filter((flag) => flag.startsWith('view_'));
    const editorFlags = [
      ...viewerFlags,
      ...Object.values(PERMISSION_FLAGS).filter((flag) => flag.startsWith('edit_')),
    ];
    const adminFlags = Object.values(PERMISSION_FLAGS);

    if (template === 'viewer') {
      // Sadece görüntüleme izinleri
      setRole({
        name: 'Viewer',
        description: 'Has view permissions only',
        flags: viewerFlags,
      });
    } else if (template === 'editor') {
      // Görüntüleme ve düzenleme izinleri
      setRole({
        name: 'Editor',
        description: 'Has view and edit permissions',
        flags: editorFlags,
      });
    } else if (template === 'admin') {
      // Tüm izinler
      setRole({
        name: 'Admin',
        description: 'Has all permissions',
        flags: adminFlags,
      });
    }
  };

  return {
    role,
    updateRoleName,
    updateRoleDescription,
    updateRoleFlags,
    toggleFlag,
    resetRole,
    applyTemplate,
  };
}
