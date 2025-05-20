import type { IconifyProps } from 'src/components/iconify';

import React from 'react';

import { Iconify } from 'src/components/iconify'; // IconifyProps import edildi varsayılıyor

// IconifyProps'tan 'icon' dışındaki props'ları alalım
type IconProps = Omit<IconifyProps, 'icon'>;

/**
 * Verilen dosya yoluna göre uygun dosya ikonunu döndürür.
 * @param filePath Dosya yolu (örn: 'contracts/MyContract.sol' veya 'src/lib.rs')
 * @param props Iconify bileşenine geçirilecek ek props'lar (örn: sx)
 * @returns Iconify elementi veya null
 */
export function getFileIconElement(
  filePath: string | undefined | null,
  props: IconProps = {}
): React.ReactElement | null {
  if (!filePath) {
    return null;
  }

  const defaultSx = { width: 18, height: 18, flexShrink: 0 };
  const finalSx = { ...defaultSx, ...props.sx };
  const finalProps = { ...props, sx: finalSx };

  // Dosya adını yoldan ayır. filePath 'scripts/deploy.js' ise fileName 'deploy.js' olur.
  // filePath 'lib.rs' ise fileName 'lib.rs' olur.
  const fileName = filePath.includes('/')
    ? filePath.substring(filePath.lastIndexOf('/') + 1)
    : filePath;

  // 1. Specific full filenames (most specific)
  if (fileName === 'hardhat.config.js') {
    return (
      <Iconify
        icon="devicon:hardhat"
        {...finalProps}
        sx={{ ...finalSx, color: props.color || 'warning.main' }}
      />
    );
  }
  if (fileName === 'config.js') {
    return (
      <Iconify
        icon="solar:settings-bold"
        {...finalProps}
        sx={{ ...finalSx, color: props.color || 'primary.main' }}
      />
    );
  }
  if (fileName === 'Anchor.toml' || fileName === 'Cargo.toml') {
    return (
      <Iconify
        icon="file-icons:toml"
        {...finalProps}
        sx={{ ...finalSx, color: props.color || 'grey.600' }}
      />
    );
  }
  if (fileName === 'package.json') {
    return (
      <Iconify
        icon="file-icons:npm"
        {...finalProps}
        sx={{ ...finalSx, color: props.color || 'error.dark' }}
      />
    );
  }
  if (fileName === 'tsconfig.json') {
    return (
      <Iconify
        icon="file-icons:config-typescript"
        {...finalProps}
        sx={{ ...finalSx, color: props.color || 'error.light' }}
      />
    );
  } /*  */
  if (fileName === '.gitignore') {
    return (
      <Iconify
        icon="devicon:git"
        {...finalProps}
        sx={{ ...finalSx, color: props.color || 'text.disabled' }}
      />
    );
  }

  // 2. Extensions (less specific than full names, more specific than generic file/folder)
  if (filePath.endsWith('.sol')) {
    return (
      <Iconify
        icon="file-icons:solidity"
        {...finalProps}
        sx={{ ...finalSx, color: props.color || 'warning.dark' }}
      />
    );
  }
  if (filePath.endsWith('.md')) {
    return (
      <Iconify
        icon="ri:markdown-line"
        {...finalProps}
        sx={{ ...finalSx, color: props.color || 'info.main' }}
      />
    );
  }
  if (filePath.endsWith('.rs')) {
    return (
      <Iconify
        icon="file-icons:config-rust"
        {...finalProps}
        sx={{ ...finalSx, color: props.color || 'error.main' }}
      />
    );
  }
  if (filePath.endsWith('.test.js') || filePath.endsWith('.spec.js')) {
    return (
      <Iconify
        icon="file-icons:test-js"
        {...finalProps}
        sx={{ ...finalSx, color: props.color || 'success.main' }}
      />
    );
  }
  if (filePath.endsWith('.js')) {
    return (
      <Iconify
        icon="file-icons:config-js"
        {...finalProps}
        sx={{ ...finalSx, color: props.color || 'info.main' }}
      />
    );
  }
  if (filePath.endsWith('.ts')) {
    return (
      <Iconify
        icon="file-icons:typescript"
        {...finalProps}
        sx={{ ...finalSx, color: props.color || 'info.main' }}
      />
    );
  }
  if (
    filePath.endsWith('.env') ||
    filePath.endsWith('.env.local') ||
    filePath.endsWith('.env.example')
  ) {
    return (
      <Iconify
        icon="mdi:shield-key-outline"
        {...finalProps}
        sx={{ ...finalSx, color: props.color || 'secondary.main' }}
      />
    );
  }
  if (filePath.endsWith('.json')) {
    // General .json, after specific json files like package.json, tsconfig.json
    return (
      <Iconify
        icon="file-icons:json"
        {...finalProps}
        sx={{ ...finalSx, color: props.color || 'text.secondary' }}
      />
    );
  }

  // 3. Default file icon if no specific rule matched but it seems like a file (has an extension)
  // or if it's a file without extension that wasn't caught by specific name checks (e.g. 'LICENSE', 'README')
  // A simple check for '.' in the fileName can indicate it's likely a file.
  // Or, if it doesn't have a '.', but it's a common no-extension filename.
  const knownNoExtensionFiles = ['readme', 'license', 'contributing', 'dockerfile', 'procfile'];
  if (fileName.includes('.') || knownNoExtensionFiles.includes(fileName.toLowerCase())) {
    return (
      <Iconify
        icon="solar:file-text-bold"
        {...finalProps}
        sx={{ ...finalSx, color: props.color || 'text.primary' }}
      />
    );
  }

  return (
    <Iconify
      icon="solar:folder-bold"
      {...finalProps}
      sx={{ ...finalSx, color: props.color || 'text.secondary' }}
    />
  );
}
