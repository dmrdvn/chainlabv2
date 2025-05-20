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
  V0_28_0 = '0.28.0',
  V0_27_0 = '0.27.0',
}

// Add other compiler-related constants or types here if needed
