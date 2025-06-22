export enum SolidityVersion {
  LATEST = '0.8.24', // Example: Replace with actual latest or desired default
  V0_8_20 = '0.8.20',
  V0_8_19 = '0.8.19',
  V0_8_13 = '0.8.13',
  V0_8_7 = '0.8.7',
  V0_7_6 = '0.7.6',
  V0_6_12 = '0.6.12',
  V0_5_16 = '0.5.16',
}

export enum EvmVersion {
  DEFAULT = 'paris', // Current default for many tools
  PARIS = 'paris',
  LONDON = 'london',
  BERLIN = 'berlin',
  ISTANBUL = 'istanbul',
  MUIR_GLACIER = 'muirGlacier',
  PETERSBURG = 'petersburg',
  CONSTANTINOPLE = 'constantinople',
  BYZANTIUM = 'byzantium',
  SPURIOUS_DRAGON = 'spuriousDragon',
  TANGERINE_WHISTLE = 'tangerineWhistle',
  HOMESTEAD = 'homestead',
}

export enum AnchorVersion { // For Solana
  LATEST = '0.29.0',
  V0_29_0 = '0.29.0',
  V0_28_0 = '0.28.0',
  V0_27_0 = '0.27.0',
}

export enum SorobanVersion {
  V22_0_0 = '22.0.0', // Example version, adjust as needed
  V21_0_0 = '21.0.0',
}

export const solidityVersionValues = Object.values(SolidityVersion);
export const evmVersionValues = Object.values(EvmVersion);
export const anchorVersionValues = Object.values(AnchorVersion);
export const sorobanVersionValues = Object.values(SorobanVersion);

// Add other compiler-related constants or types here if needed
