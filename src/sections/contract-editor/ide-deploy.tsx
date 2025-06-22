import type { SelectChangeEvent } from '@mui/material/Select';
import type { EvmAccountInfo } from 'src/components/connect-wallet/connect-evm-wallet';
import type { SolanaAccountInfo } from 'src/components/connect-wallet/connect-solana-wallet';

import { toast } from 'sonner';
import React, { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { Iconify } from 'src/components/iconify';
import { ConnectEvmWallet } from 'src/components/connect-wallet/connect-evm-wallet';
import { ConnectSolanaWallet } from 'src/components/connect-wallet/connect-solana-wallet';

import type { ArtifactForDeploy } from './view/contract-editor-view';

export interface DeployedEvmContractInfo {
  id: string;
  name: string;
  address: string;
  network: string;
  timestamp: string;
  txHash: string;
  blockNumber?: number;
  abi?: any[];
  blockExplorerUrl?: string;
}
export interface DeployedSolanaProgramInfo {
  id: string;
  name: string;
  programId: string;
  network: string;
  timestamp: string;
  txHash?: string;
}

export interface DeployedStellarContractInfo {
  id: string;
  name: string;
  contractId: string;
  network: string;
  timestamp: string;
  txHash: string;
}

// --- Mock Data (Bu mock datalar bileşen içinde kalacak) ---
// EVM
const evmEnvironments = [
  { id: 'metamask', name: 'Metamask / Browser Wallet' },
  { id: 'local_hardhat', name: 'Local Hardhat Node' },
];
const mockEvmWallets = {
  // Metamask dışı ortamlar için
  local_hardhat: [
    {
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      name: 'Hardhat Account 0',
    },
    {
      address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      name: 'Hardhat Account 1',
    },
  ],
};
// Deploy edilecek kontratlar için mock data
// const mockCompiledEvmContracts = [ /* ... */ ]; // KALDIRILDI
const valueUnits = ['Wei', 'Gwei', 'Ether'];

// Solana
const solanaEnvironments = [
  { id: 'local_validator', name: 'Local Solana Validator' },
  { id: 'browser', name: 'Browser Wallet (Phantom, Solflare, etc.)' },
];
const mockSolanaWallets = {
  // Tarayıcı dışı ortamlar için
  local_validator: [{ address: 'Loc1V...def', name: 'Local Validator Wallet 1' }],
};

// Stellar
const stellarEnvironments = [
  { id: 'testnet', name: 'Stellar Testnet' },
  { id: 'local_network', name: 'Local Network' },
  { id: 'browser', name: 'Browser Wallet (Freighter, xBull, etc.)' },
];
const mockStellarWallets = {
  testnet: [
    {
      address: 'GCXMWUAUF37IWOOV2FREUC7SASLD4HFSM7VWGWTEQVBPSJP7HHZFVJDZ',
      name: 'Testnet Account 1',
    },
    {
      address: 'GDQOE23CFSUMSVQK4Y5JHPPYK73VYCNHZHA7ENKCV37P6SUEO6XQBKPP',
      name: 'Testnet Account 2',
    },
  ],
  local_network: [
    {
      address: 'GCKFBEIYTKP6RCZNVPH73XL7XFWTEOAO7GIBD6TQJDD4YWDMG4PQCXL',
      name: 'Local Network Account',
    },
  ],
};
// --- End of Mock Data ---

interface IdeDeployProps {
  platform: 'evm' | 'solana' | 'stellar' | null;
  onDeployEvm: (deployConfig: {
    environmentId: string;
    walletAddress: string;
    gasLimit?: string;
    value?: string;
    valueUnit?: string;
    artifactToDeploy: ArtifactForDeploy;
    constructorArgs?: any[];
  }) => Promise<void>;
  onDeploySolana: (deployConfig: {
    environmentId: string;
    walletAddress: string;
    artifactToDeploy: ArtifactForDeploy;
  }) => Promise<void>;
  onDeployStellar: (deployConfig: {
    environmentId: string;
    walletAddress: string;
    artifactToDeploy: ArtifactForDeploy;
  }) => Promise<void>;
  isDeploying: boolean;
  deployedEvmContracts: DeployedEvmContractInfo[];
  deployedSolanaPrograms: DeployedSolanaProgramInfo[];
  deployedStellarContracts: DeployedStellarContractInfo[];
  expandedEvmAccordion: string | false;
  onEvmAccordionChange: (panel: string, isExpanded: boolean) => void;
  expandedSolanaAccordion: string | false;
  onSolanaAccordionChange: (panel: string, isExpanded: boolean) => void;
  expandedStellarAccordion: string | false;
  onStellarAccordionChange: (panel: string, isExpanded: boolean) => void;
  compiledArtifactsForDeploy: ArtifactForDeploy[];
}

export function IdeDeploy({
  platform,
  onDeployEvm,
  onDeploySolana,
  onDeployStellar,
  isDeploying,
  deployedEvmContracts,
  deployedSolanaPrograms,
  deployedStellarContracts,
  expandedEvmAccordion,
  onEvmAccordionChange,
  expandedSolanaAccordion,
  onSolanaAccordionChange,
  expandedStellarAccordion,
  onStellarAccordionChange,
  compiledArtifactsForDeploy,
}: IdeDeployProps) {
  const theme = useTheme();

  // EVM için UI state'leri (ide-deploy içinde kalacak)
  const [browserEvmAccounts, setBrowserEvmAccounts] = useState<EvmAccountInfo[]>([]);
  const [selectedEvmAccountAddress, setSelectedEvmAccountAddress] = useState<string>('');
  const [environmentEvm, setEnvironmentEvm] = useState(evmEnvironments[0].id);
  const [selectedArtifactIdEvm, setSelectedArtifactIdEvm] = useState<string>('');
  const [gasLimit, setGasLimit] = useState('');
  const [value, setValue] = useState('');
  const [valueUnit, setValueUnit] = useState(valueUnits[0]);
  const [constructorArgValues, setConstructorArgValues] = useState<{ [index: number]: string }>({});

  // Solana için UI state'leri (ide-deploy içinde kalacak)
  const [environmentSolana, setEnvironmentSolana] = useState(solanaEnvironments[0].id);
  const [walletAddressSolana, setWalletAddressSolana] = useState(
    // Mock cüzdanlar için
    environmentSolana !== 'browser' &&
      mockSolanaWallets[environmentSolana as keyof typeof mockSolanaWallets]?.length > 0
      ? mockSolanaWallets[environmentSolana as keyof typeof mockSolanaWallets]?.[0]?.address || ''
      : ''
  );
  const [selectedArtifactIdSolana, setSelectedArtifactIdSolana] = useState<string>('');
  const [browserSolanaAccounts, setBrowserSolanaAccounts] = useState<SolanaAccountInfo[]>([]);
  const [selectedSolanaAccountAddress, setSelectedSolanaAccountAddress] = useState<string>('');

  // Stellar (Soroban) States
  const [selectedArtifactIdStellar, setSelectedArtifactIdStellar] = useState<string>('');
  const [environmentStellar, setEnvironmentStellar] = useState('testnet');
  const [walletAddressStellar, setWalletAddressStellar] = useState(
    'GCXMWUAUF37IWOOV2FREUC7SASLD4HFSM7VWGWTEQVBPSJP7HHZFVJDZ'
  );

  // EVM Deploy Buton Handler'ı
  const handleDeployEvmClick = () => {
    const selectedArtifact = compiledArtifactsForDeploy.find((a) => a.id === selectedArtifactIdEvm);
    if (!selectedEvmAccountAddress || !selectedArtifact) {
      toast.error('Please select a wallet and a compiled contract.');
      return;
    }

    let parsedConstructorArgs: any[] | undefined;
    if (
      selectedArtifact.platform === 'evm' &&
      selectedArtifact.constructorInputs &&
      selectedArtifact.constructorInputs.length > 0
    ) {
      try {
        parsedConstructorArgs = selectedArtifact.constructorInputs.map((input, index) => {
          const value = constructorArgValues[index]; // Artık || '' yok, undefined olabilir

          // Eğer input varsa ve kullanıcı hiçbir şey girmemişse (undefined veya boş string)
          // ve input tipi string değilse (boş string stringler için geçerli olabilir)
          // VEYA input tipi string ve tamamen boşluklardan oluşuyorsa.
          if (value === undefined || (value.trim() === '' && input.type !== 'string')) {
            // Eğer tip gerçekten boş olamıyorsa (örn: uint, bool, address)
            if (!['string', 'bytes'].some((type) => input.type.startsWith(type))) {
              // string ve bytesX tipleri boş olabilir
              toast.error(
                `Constructor argument '${input.name || `Arg ${index + 1}`}' (${input.type}) is required and cannot be empty.`
              );
              throw new Error('Missing required constructor argument'); // Hata fırlatarak işlemi durdur
            }
          }

          // Değer boş string ise ve tip string ise kabul et.
          const finalValue = value === undefined ? '' : value;

          if (input.type.startsWith('uint') || input.type.startsWith('int')) {
            return finalValue;
          }
          if (input.type === 'bool') {
            return finalValue.toLowerCase() === 'true';
          }
          return finalValue;
        });
      } catch (error: any) {
        // toast.error(error.message); // Zaten yukarıda toast gösteriliyor.
        return; // Hata durumunda fonksiyondan çık
      }
    }

    console.log('--- EVM DEPLOY REQUEST ---');
    console.log('Environment ID:', environmentEvm);
    console.log('Wallet Address:', selectedEvmAccountAddress);
    console.log('Selected Artifact:', selectedArtifact);
    console.log('Gas Limit:', gasLimit || 'Default');
    console.log('Value:', value || '0', valueUnit);
    console.log('Constructor Args:', parsedConstructorArgs);
    console.log('---------------------------');

    onDeployEvm({
      environmentId: environmentEvm,
      walletAddress: selectedEvmAccountAddress,
      gasLimit: gasLimit || undefined,
      value: value || undefined,
      valueUnit,
      artifactToDeploy: selectedArtifact,
      constructorArgs: parsedConstructorArgs,
    }).finally(() => {
      // Deploy işlemi bittikten sonra (başarılı veya başarısız)
      // constructor argümanlarını temizle, böylece bir sonraki deploy için hazır olur.
      // Ancak bu, isDeploying state'i ile senkronize olmayabilir eğer üst bileşen onu yönetiyorsa.
      // Şimdilik burada bırakalım, eğer sorun olursa contract-editor-view'a taşıyabiliriz.
      // setConstructorArgValues({}); // Kullanıcı, dağıtım sonrası inputların kalmasını isteyebilir, bu yüzden bunu şimdilik yoruma alıyorum.
      // Eğer her dağıtım sonrası sıfırlanması isteniyorsa aşağıdaki satır aktif edilebilir.
      // setConstructorArgValues({});
    });
    // Dağıtım isteği gönderildikten hemen sonra inputları temizleyebiliriz.
    // Bu, kullanıcının aynı argümanlarla tekrar deploy yapmasını engellemez (çünkü artifact seçimi değişmediyse inputlar tekrar dolmaz)
    // Ama UI'ı temizler.
    setConstructorArgValues({});
  };

  // Accordion handler'ları props'tan gelenleri sarmalayacak (isim çakışmasını önlemek için)
  const handleEvmAccordionChangeInternal =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      onEvmAccordionChange(panel, isExpanded); // Props'tan geleni çağır
    };

  // Solana Deploy Buton Handler'ı
  const handleDeploySolanaClick = () => {
    const selectedArtifact = compiledArtifactsForDeploy.find(
      (a) => a.id === selectedArtifactIdSolana
    );
    const addressToUse =
      environmentSolana === 'browser' ? selectedSolanaAccountAddress : walletAddressSolana;

    if (!addressToUse || !selectedArtifact) {
      toast.error('Please select a wallet/address and a compiled program.');
      return;
    }
    console.log('--- SOLANA DEPLOY REQUEST ---');
    console.log('Environment ID:', environmentSolana);
    console.log('Wallet/Account Address:', addressToUse);
    console.log('Selected Artifact:', selectedArtifact);
    console.log('-----------------------------');

    onDeploySolana({
      environmentId: environmentSolana,
      walletAddress: addressToUse,
      artifactToDeploy: selectedArtifact,
    });
  };

  const handleSolanaAccordionChangeInternal =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      onSolanaAccordionChange(panel, isExpanded); // Props'tan geleni çağır
    };

  // Stellar Deploy Buton Handler'ı
  const handleDeployStellarClick = () => {
    const selectedArtifact = compiledArtifactsForDeploy.find(
      (a) => a.id === selectedArtifactIdStellar
    );

    if (!walletAddressStellar || !selectedArtifact) {
      toast.error('Please select a wallet and a compiled contract.');
      return;
    }

    console.log('--- STELLAR DEPLOY REQUEST ---');
    console.log('Environment ID:', environmentStellar);
    console.log('Wallet Address:', walletAddressStellar);
    console.log('Selected Artifact:', selectedArtifact);
    console.log('------------------------------');

    onDeployStellar({
      environmentId: environmentStellar,
      walletAddress: walletAddressStellar,
      artifactToDeploy: selectedArtifact,
    });
  };

  const handleStellarAccordionChangeInternal =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      onStellarAccordionChange(panel, isExpanded);
    };

  // Cüzdan hesap değişiklikleri için callback'ler (Bunlar ide-deploy içinde kalabilir)
  const handleEvmAccountsChange = useCallback(
    (accounts: EvmAccountInfo[]) => {
      setBrowserEvmAccounts(accounts);
      // Eğer Metamask seçiliyse ve gelen hesap listesi boş değilse ilkini seç,
      // veya mevcut seçili adres listede yoksa ilkini seç.
      // Liste boşsa seçimi temizle.
      if (environmentEvm === 'metamask') {
        if (accounts.length > 0) {
          if (
            !selectedEvmAccountAddress ||
            !accounts.find((acc) => acc.address === selectedEvmAccountAddress)
          ) {
            setSelectedEvmAccountAddress(accounts[0].address);
          }
        } else {
          setSelectedEvmAccountAddress('');
        }
      }
    },
    [environmentEvm, selectedEvmAccountAddress]
  ); // selectedEvmAccountAddress bağımlılığı eklendi, çünkü karşılaştırma yapılıyor.

  const handleSolanaAccountsChange = useCallback(
    (accounts: SolanaAccountInfo[]) => {
      setBrowserSolanaAccounts(accounts);
      // Eğer tarayıcı cüzdanı seçiliyse ve gelen hesap listesi boş değilse ilkini seç,
      // veya mevcut seçili adres listede yoksa ilkini seç.
      // Liste boşsa seçimi temizle.
      if (environmentSolana === 'browser') {
        if (accounts.length > 0) {
          if (
            !selectedSolanaAccountAddress ||
            !accounts.find((acc) => acc.address === selectedSolanaAccountAddress)
          ) {
            setSelectedSolanaAccountAddress(accounts[0].address);
          }
        } else {
          setSelectedSolanaAccountAddress('');
        }
      }
    },
    [environmentSolana, selectedSolanaAccountAddress]
  ); // selectedSolanaAccountAddress bağımlılığı eklendi

  // EVM: Ortam veya tarayıcı hesapları değiştiğinde seçili hesabı ayarla
  useEffect(() => {
    if (environmentEvm === 'metamask') {
      // Metamask seçiliyken, handleEvmAccountsChange zaten tarayıcıdan gelen hesapları işleyip ilkini seçecektir.
      // Eğer tarayıcıdan hiç hesap gelmediyse (browserEvmAccounts boşsa) ve bir adres seçiliyse, bunu temizle.
      if (browserEvmAccounts.length === 0 && selectedEvmAccountAddress !== '') {
        setSelectedEvmAccountAddress('');
      } else if (
        browserEvmAccounts.length > 0 &&
        (!selectedEvmAccountAddress ||
          !browserEvmAccounts.find((acc) => acc.address === selectedEvmAccountAddress))
      ) {
        // Tarayıcı hesapları var ama hiçbiri seçili değilse veya seçili olan artık listede yoksa ilkini seç
        setSelectedEvmAccountAddress(browserEvmAccounts[0].address);
      }
    } else {
      // Mock (Hardhat vb.) ortam seçildiğinde, mock cüzdanlardan ilkini ayarla
      const currentMockWallets =
        mockEvmWallets[environmentEvm as keyof typeof mockEvmWallets] || [];
      const targetAddress = currentMockWallets[0]?.address || '';
      if (selectedEvmAccountAddress !== targetAddress) {
        setSelectedEvmAccountAddress(targetAddress);
      }
    }
  }, [environmentEvm, browserEvmAccounts, selectedEvmAccountAddress]); // selectedEvmAccountAddress eklendi, döngü kontrolü için.

  // Solana: Ortam veya tarayıcı hesapları değiştiğinde seçili hesabı/cüzdanı ayarla
  useEffect(() => {
    if (environmentSolana === 'browser') {
      // Tarayıcı cüzdanı seçiliyken, handleSolanaAccountsChange tarayıcıdan gelen hesapları işleyip ilkini seçecektir.
      // Mock cüzdan adresi varsa temizle.
      if (walletAddressSolana !== '') {
        setWalletAddressSolana('');
      }
      if (browserSolanaAccounts.length === 0 && selectedSolanaAccountAddress !== '') {
        setSelectedSolanaAccountAddress('');
      } else if (
        browserSolanaAccounts.length > 0 &&
        (!selectedSolanaAccountAddress ||
          !browserSolanaAccounts.find((acc) => acc.address === selectedSolanaAccountAddress))
      ) {
        setSelectedSolanaAccountAddress(browserSolanaAccounts[0].address);
      }
    } else {
      // Mock (Local validator vb.) ortam seçildiğinde
      // Tarayıcı hesaplarını ve seçili tarayıcı hesabını temizle
      if (browserSolanaAccounts.length > 0) setBrowserSolanaAccounts([]);
      if (selectedSolanaAccountAddress !== '') setSelectedSolanaAccountAddress('');

      const currentMockWallets =
        mockSolanaWallets[environmentSolana as keyof typeof mockSolanaWallets] || [];
      const targetAddress = currentMockWallets[0]?.address || '';
      if (walletAddressSolana !== targetAddress) {
        setWalletAddressSolana(targetAddress);
      }
    }
  }, [environmentSolana, browserSolanaAccounts, walletAddressSolana, selectedSolanaAccountAddress]); // walletAddressSolana ve selectedSolanaAccountAddress eklendi

  // Derlenmiş artifact'ler değiştiğinde seçili artifact ID'sini güncelle
  useEffect(() => {
    if (platform === 'evm') {
      const evmArtifacts = compiledArtifactsForDeploy.filter((a) => a.platform === 'evm');
      if (evmArtifacts.length > 0) {
        const currentSelectionValid = evmArtifacts.some((a) => a.id === selectedArtifactIdEvm);
        if (!currentSelectionValid || !selectedArtifactIdEvm) {
          setSelectedArtifactIdEvm(evmArtifacts[0].id);
          setConstructorArgValues({}); // Yeni artifact seçildiğinde argümanları sıfırla
        }
      } else {
        setSelectedArtifactIdEvm('');
        setConstructorArgValues({}); // Artifact listesi boşsa sıfırla
      }
    } else {
      // Eğer platform EVM değilse de argümanları temizleyebiliriz.
      setConstructorArgValues({});
    }
  }, [platform, compiledArtifactsForDeploy, selectedArtifactIdEvm]);

  useEffect(() => {
    if (platform === 'solana') {
      const solanaArtifacts = compiledArtifactsForDeploy.filter((a) => a.platform === 'solana');
      if (solanaArtifacts.length > 0) {
        const currentSelectionValid = solanaArtifacts.some(
          (a) => a.id === selectedArtifactIdSolana
        );
        if (!currentSelectionValid || !selectedArtifactIdSolana) {
          setSelectedArtifactIdSolana(solanaArtifacts[0].id);
        }
      } else {
        setSelectedArtifactIdSolana('');
      }
    }
  }, [platform, compiledArtifactsForDeploy, selectedArtifactIdSolana]);

  useEffect(() => {
    if (platform === 'stellar') {
      const stellarArtifacts = compiledArtifactsForDeploy.filter((a) => a.platform === 'stellar');
      if (stellarArtifacts.length > 0) {
        const currentSelectionValid = stellarArtifacts.some(
          (a) => a.id === selectedArtifactIdStellar
        );
        if (!currentSelectionValid || !selectedArtifactIdStellar) {
          setSelectedArtifactIdStellar(stellarArtifacts[0].id);
        }
      } else {
        setSelectedArtifactIdStellar('');
      }
    }
  }, [platform, compiledArtifactsForDeploy, selectedArtifactIdStellar]);

  const renderEvmDeploy = () => {
    const currentEvmArtifacts = compiledArtifactsForDeploy.filter((a) => a.platform === 'evm');
    const currentWalletsForDropdown =
      environmentEvm === 'metamask'
        ? browserEvmAccounts
        : mockEvmWallets[environmentEvm as keyof typeof mockEvmWallets] || [];

    const selectedEvmArtifact = currentEvmArtifacts.find((art) => art.id === selectedArtifactIdEvm);

    const handleConstructorArgChange = (index: number, value: string) => {
      setConstructorArgValues((prev) => ({ ...prev, [index]: value }));
    };

    return (
      <Stack spacing={2.5}>
        <FormControl fullWidth size="small">
          <InputLabel id="evm-environment-select-label">Environment</InputLabel>
          <Select
            labelId="evm-environment-select-label"
            value={environmentEvm}
            label="Environment"
            onChange={(e) => setEnvironmentEvm(e.target.value)}
          >
            {evmEnvironments.map((env) => (
              <MenuItem key={env.id} value={env.id}>
                {env.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {environmentEvm === 'metamask' && (
          <Box
            sx={{
              border: (theme) => `1px dashed ${theme.palette.divider}`,
              borderRadius: 1,
              p: 1.5,
              backgroundColor: (theme) => theme.palette.background.neutral,
            }}
          >
            <ConnectEvmWallet onAccountsChange={handleEvmAccountsChange} />
          </Box>
        )}

        {(environmentEvm !== 'metamask' ||
          (environmentEvm === 'metamask' && browserEvmAccounts.length > 0)) &&
          currentWalletsForDropdown.length > 0 && (
            <FormControl
              fullWidth
              size="small"
              disabled={environmentEvm === 'metamask' && browserEvmAccounts.length === 0}
            >
              <InputLabel id="evm-wallet-select-label">Wallet Account</InputLabel>
              <Select
                labelId="evm-wallet-select-label"
                value={selectedEvmAccountAddress}
                label="Wallet Account"
                onChange={(e) => setSelectedEvmAccountAddress(e.target.value)}
              >
                {currentWalletsForDropdown.map((wallet) => (
                  <MenuItem key={wallet.address} value={wallet.address}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ overflow: 'hidden' }}
                    >
                      <Iconify icon="material-symbols:account-balance-wallet-outline" width={16} />
                      <Typography variant="body2" noWrap sx={{ flexGrow: 1 }}>
                        {wallet.name}
                      </Typography>
                      <Typography variant="caption" noWrap color="text.secondary">
                        ({wallet.address.slice(0, 6)}...{wallet.address.slice(-4)})
                      </Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

        <FormControl
          fullWidth
          size="small"
          disabled={!selectedEvmAccountAddress || currentEvmArtifacts.length === 0}
        >
          <InputLabel>Contract</InputLabel>
          <Select
            value={selectedArtifactIdEvm}
            label="Contract"
            onChange={(e: SelectChangeEvent<string>) => setSelectedArtifactIdEvm(e.target.value)}
          >
            {currentEvmArtifacts.map((artifact) => (
              <MenuItem key={artifact.id} value={artifact.id}>
                {artifact.name}
              </MenuItem>
            ))}
            {currentEvmArtifacts.length === 0 && (
              <MenuItem disabled value="">
                No compiled contracts available
              </MenuItem>
            )}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          size="small"
          label="Value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!selectedEvmAccountAddress}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Select
                  variant="standard"
                  disableUnderline
                  value={valueUnit}
                  onChange={(e) => setValueUnit(e.target.value)}
                  sx={{
                    mr: -1,
                    '& .MuiSelect-select': { py: 0.5, mr: 1, fontSize: 'caption.fontSize' },
                  }}
                >
                  {valueUnits.map((unit) => (
                    <MenuItem key={unit} value={unit}>
                      {' '}
                      {unit}{' '}
                    </MenuItem>
                  ))}
                </Select>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          size="small"
          label="Gas Limit (Optional)"
          placeholder="e.g., 3000000"
          value={gasLimit}
          onChange={(e) => setGasLimit(e.target.value)}
          disabled={!selectedEvmAccountAddress}
        />

        {/* Dinamik Constructor Argümanları Alanı */}
        {selectedEvmArtifact &&
          selectedEvmArtifact.constructorInputs &&
          selectedEvmArtifact.constructorInputs.length > 0 && (
            <Box
              sx={{
                border: (theme) => `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                p: 2,
              }}
            >
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 1.5 }}>
                Constructor
              </Typography>
              <Stack spacing={1.5}>
                {selectedEvmArtifact.constructorInputs.map((input, index) => (
                  <TextField
                    key={index}
                    fullWidth
                    size="small"
                    label={`${input.name || `Arg ${index + 1}`} (${input.type})`}
                    placeholder={`Enter value for ${input.type}`}
                    value={constructorArgValues[index] || ''}
                    onChange={(e) => handleConstructorArgChange(index, e.target.value)}
                    disabled={!selectedEvmAccountAddress}
                  />
                ))}
              </Stack>
            </Box>
          )}

        <Button
          variant="contained"
          color="primary"
          onClick={handleDeployEvmClick}
          disabled={isDeploying || !selectedEvmAccountAddress || !selectedArtifactIdEvm}
          fullWidth
          startIcon={<Iconify icon="material-symbols:rocket-launch" />}
        >
          {isDeploying ? 'Deploying...' : 'Deploy Contract'}
        </Button>

        <Box>
          <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ color: 'text.primary', textAlign: 'center', fontWeight: 'bold', mb: 2 }}
          >
            Deployed Contracts
          </Typography>
          {deployedEvmContracts.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
              No EVM contracts deployed yet.
            </Typography>
          ) : (
            <Box sx={{ mt: 1 }}>
              {deployedEvmContracts.map((contract) => (
                <Accordion
                  key={contract.id}
                  expanded={expandedEvmAccordion === contract.id}
                  onChange={handleEvmAccordionChangeInternal(contract.id)}
                  disableGutters
                  elevation={0}
                  sx={{
                    mb: 1,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    '&:before': { display: 'none' },
                    '&:last-of-type': { mb: 0 },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
                    aria-controls={`${contract.id}-content`}
                    id={`${contract.id}-header`}
                    sx={{
                      minHeight: 48,
                      '&.Mui-expanded': { minHeight: 48 },
                      '& .MuiAccordionSummary-content': {
                        my: 1,
                        '&.Mui-expanded': { my: 1 },
                        alignItems: 'center',
                      },
                    }}
                  >
                    <Iconify
                      icon="healthicons:contract-document-outline"
                      sx={{ mr: 1, color: 'primary.main', flexShrink: 0 }}
                    />
                    <Typography variant="subtitle2" sx={{ flexShrink: 0, mr: 1 }}>
                      {' '}
                      {contract.name}{' '}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {' '}
                      ({contract.address.substring(0, 5)}...
                      {contract.address.substring(contract.address.length - 5)}){' '}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{ p: 2, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}
                  >
                    <Stack spacing={1}>
                      <Typography variant="caption">
                        {' '}
                        <strong>Network:</strong> {contract.network}{' '}
                      </Typography>
                      <Typography variant="caption">
                        {' '}
                        <strong>Deployed:</strong> {contract.timestamp}{' '}
                      </Typography>
                      {contract.txHash && (
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Typography variant="caption">
                            {' '}
                            <strong>Tx:</strong>{' '}
                          </Typography>
                          <Link
                            href={
                              contract.blockExplorerUrl
                                ? `${contract.blockExplorerUrl}/tx/${contract.txHash}`
                                : `https://etherscan.io/tx/${contract.txHash}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="caption"
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              wordBreak: 'break-all',
                            }}
                          >
                            {`${contract.txHash.substring(0, 6)}...${contract.txHash.substring(contract.txHash.length - 4)}`}
                            <Iconify icon="eva:external-link-fill" width={14} sx={{ ml: 0.5 }} />
                          </Link>
                        </Stack>
                      )}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </Box>
      </Stack>
    );
  };

  const renderSolanaDeploy = () => {
    const currentSolanaArtifacts = compiledArtifactsForDeploy.filter(
      (a) => a.platform === 'solana'
    );
    const currentMockWalletsForDropdown =
      environmentSolana !== 'browser' &&
      mockSolanaWallets[environmentSolana as keyof typeof mockSolanaWallets]
        ? mockSolanaWallets[environmentSolana as keyof typeof mockSolanaWallets] || []
        : [];
    const addressToUseForButtonState =
      environmentSolana === 'browser' ? selectedSolanaAccountAddress : walletAddressSolana;

    return (
      <Stack spacing={3}>
        <FormControl fullWidth size="small">
          <InputLabel>Environment</InputLabel>
          <Select
            value={environmentSolana}
            label="Environment"
            onChange={(e) => setEnvironmentSolana(e.target.value)}
            sx={{ fontSize: '0.875rem' }}
          >
            {solanaEnvironments.map((env) => (
              <MenuItem key={env.id} value={env.id} sx={{ fontSize: '0.875rem' }}>
                {' '}
                {env.name}{' '}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {environmentSolana === 'browser' ? (
          <>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                border: (theme) => `1px dashed ${theme.palette.divider}`,
                backgroundColor: (theme) => theme.palette.background.neutral,
              }}
            >
              <ConnectSolanaWallet onAccountsChange={handleSolanaAccountsChange} />
            </Box>
            {browserSolanaAccounts.length > 0 && (
              <FormControl fullWidth size="small">
                <InputLabel>Account (Browser)</InputLabel>
                <Select
                  value={selectedSolanaAccountAddress}
                  label="Account (Browser)"
                  onChange={(e) => setSelectedSolanaAccountAddress(e.target.value)}
                  renderValue={(value) =>
                    browserSolanaAccounts.find((acc) => acc.address === value)?.name ||
                    'Select Account'
                  }
                  sx={{ fontSize: '0.875rem' }}
                >
                  {browserSolanaAccounts.map((account) => (
                    <MenuItem key={account.address} value={account.address}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ overflow: 'hidden' }}
                      >
                        <Iconify icon="cryptocurrency:sol" width={16} />
                        <Typography variant="body2" noWrap sx={{ flexGrow: 1 }}>
                          {account.name}
                        </Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </>
        ) : (
          <FormControl fullWidth size="small" disabled={currentMockWalletsForDropdown.length === 0}>
            <InputLabel>Wallet (Mock)</InputLabel>
            <Select
              value={walletAddressSolana}
              label="Wallet (Mock)"
              onChange={(e) => setWalletAddressSolana(e.target.value)}
              sx={{ fontSize: '0.875rem' }}
            >
              {currentMockWalletsForDropdown.map((wallet) => (
                <MenuItem
                  key={wallet.address}
                  value={wallet.address}
                  title={wallet.address}
                  sx={{ fontSize: '0.875rem' }}
                >
                  <Typography variant="body2" noWrap sx={{ maxWidth: 300, fontSize: '0.875rem' }}>
                    {' '}
                    {wallet.name} ({wallet.address.slice(0, 4)}...{wallet.address.slice(-4)}){' '}
                  </Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <FormControl
          fullWidth
          size="small"
          disabled={!addressToUseForButtonState || currentSolanaArtifacts.length === 0}
        >
          <InputLabel>Program</InputLabel>
          <Select
            value={selectedArtifactIdSolana}
            label="Program"
            onChange={(e: SelectChangeEvent<string>) => setSelectedArtifactIdSolana(e.target.value)}
          >
            {currentSolanaArtifacts.map((artifact) => (
              <MenuItem key={artifact.id} value={artifact.id}>
                {artifact.name}
              </MenuItem>
            ))}
            {currentSolanaArtifacts.length === 0 && (
              <MenuItem disabled value="">
                No compiled programs available
              </MenuItem>
            )}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          onClick={handleDeploySolanaClick}
          disabled={isDeploying || !selectedArtifactIdSolana || !addressToUseForButtonState}
          sx={{ textTransform: 'none', fontSize: '0.9rem' }}
          fullWidth
          startIcon={<Iconify icon="logos:solana" width={16} />}
        >
          {isDeploying ? 'Deploying...' : 'Deploy Program'}
        </Button>

        <Box>
          <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ color: 'text.primary', textAlign: 'center', fontWeight: 'bold', mb: 2 }}
          >
            Deployed Programs
          </Typography>
          {deployedSolanaPrograms.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
              No programs deployed yet in this session.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {deployedSolanaPrograms.map((program) => (
                <Accordion
                  key={program.id}
                  expanded={expandedSolanaAccordion === program.id}
                  onChange={handleSolanaAccordionChangeInternal(program.id)}
                  sx={{
                    boxShadow: 'none',
                    border: `1px solid ${theme.palette.divider}`,
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
                    sx={{
                      flexDirection: 'row-reverse',
                      pl: 1,
                      '& .MuiAccordionSummary-content': { pl: 1.5 },
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ flexGrow: 1, textAlign: 'left', fontSize: '0.875rem' }}
                    >
                      {program.name} <br /> ({program.programId.substring(0, 7)}...
                      {program.programId.substring(program.programId.length - 5)})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{ p: 1.5, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}
                  >
                    <Stack spacing={0.5}>
                      <Typography variant="caption" sx={{ fontSize: '0.8rem' }}>
                        <strong>Cluster:</strong> {program.network}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.8rem' }}>
                        <strong>Deployed:</strong> {program.timestamp}
                      </Typography>
                      {program.txHash && (
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Typography variant="caption" sx={{ fontSize: '0.8rem' }}>
                            <strong>Tx:</strong>
                          </Typography>
                          <Link
                            href={`https://explorer.solana.com/tx/${program.txHash}?cluster=${program.network.toLowerCase().includes('devnet') ? 'devnet' : program.network.toLowerCase().includes('testnet') ? 'testnet' : 'mainnet-beta'}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="caption"
                            sx={{ fontSize: '0.8rem', wordBreak: 'break-all' }}
                          >
                            {program.txHash &&
                              `${program.txHash.substring(0, 6)}...${program.txHash.substring(program.txHash.length - 4)}`}
                          </Link>
                        </Stack>
                      )}
                      <Link
                        href={`https://explorer.solana.com/address/${program.programId}?cluster=${program.network.toLowerCase().includes('devnet') ? 'devnet' : program.network.toLowerCase().includes('testnet') ? 'testnet' : 'mainnet-beta'}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="caption"
                        sx={{ fontSize: '0.8rem', wordBreak: 'break-all' }}
                      >
                        View on Explorer
                      </Link>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
    );
  };

  const renderStellarDeploy = () => {
    const stellarArtifacts = compiledArtifactsForDeploy.filter((a) => a.platform === 'stellar');
    const currentMockWalletsForDropdown =
      environmentStellar !== 'browser' &&
      mockStellarWallets[environmentStellar as keyof typeof mockStellarWallets]
        ? mockStellarWallets[environmentStellar as keyof typeof mockStellarWallets] || []
        : [];

    return (
      <Stack spacing={2.5}>
        <FormControl fullWidth size="small">
          <InputLabel id="stellar-environment-select-label">Environment</InputLabel>
          <Select
            labelId="stellar-environment-select-label"
            value={environmentStellar}
            label="Environment"
            onChange={(e) => setEnvironmentStellar(e.target.value)}
          >
            {stellarEnvironments.map((env) => (
              <MenuItem key={env.id} value={env.id}>
                {env.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {environmentStellar === 'browser' ? (
          <Box
            sx={{
              border: (theme) => `1px dashed ${theme.palette.divider}`,
              borderRadius: 1,
              p: 1.5,
              backgroundColor: (theme) => theme.palette.background.neutral,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="logos:stellar" width={20} />
              <Typography variant="body2" color="text.secondary">
                Connect Freighter or xBull wallet to deploy
              </Typography>
            </Stack>
          </Box>
        ) : (
          <FormControl fullWidth size="small" disabled={currentMockWalletsForDropdown.length === 0}>
            <InputLabel id="stellar-wallet-select-label">Wallet Account</InputLabel>
            <Select
              labelId="stellar-wallet-select-label"
              value={walletAddressStellar}
              label="Wallet Account"
              onChange={(e) => setWalletAddressStellar(e.target.value)}
            >
              {currentMockWalletsForDropdown.map((wallet) => (
                <MenuItem key={wallet.address} value={wallet.address}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ overflow: 'hidden' }}
                  >
                    <Iconify icon="logos:stellar" width={16} />
                    <Typography variant="body2" noWrap sx={{ flexGrow: 1 }}>
                      {wallet.name}
                    </Typography>
                    <Typography variant="caption" noWrap color="text.secondary">
                      ({wallet.address.slice(0, 4)}...{wallet.address.slice(-4)})
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <FormControl
          fullWidth
          size="small"
          disabled={!walletAddressStellar || stellarArtifacts.length === 0}
        >
          <InputLabel>Contract</InputLabel>
          <Select
            value={selectedArtifactIdStellar}
            label="Contract"
            onChange={(e: SelectChangeEvent<string>) =>
              setSelectedArtifactIdStellar(e.target.value)
            }
          >
            {stellarArtifacts.map((artifact) => (
              <MenuItem key={artifact.id} value={artifact.id}>
                {artifact.name}
              </MenuItem>
            ))}
            {stellarArtifacts.length === 0 && (
              <MenuItem disabled value="">
                No compiled contracts available
              </MenuItem>
            )}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          onClick={handleDeployStellarClick}
          disabled={isDeploying || !selectedArtifactIdStellar || !walletAddressStellar}
          fullWidth
          startIcon={<Iconify icon="logos:stellar" />}
        >
          {isDeploying ? 'Deploying...' : 'Deploy Contract'}
        </Button>

        <Box>
          <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ color: 'text.primary', textAlign: 'center', fontWeight: 'bold', mb: 2 }}
          >
            Deployed Contracts
          </Typography>
          {deployedStellarContracts.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
              No Stellar contracts deployed yet.
            </Typography>
          ) : (
            <Box sx={{ mt: 1 }}>
              {deployedStellarContracts.map((contract) => (
                <Accordion
                  key={contract.id}
                  expanded={expandedStellarAccordion === contract.id}
                  onChange={handleStellarAccordionChangeInternal(contract.id)}
                  disableGutters
                  elevation={0}
                  sx={{
                    mb: 1,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    '&:before': { display: 'none' },
                    '&:last-of-type': { mb: 0 },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
                    aria-controls={`${contract.id}-content`}
                    id={`${contract.id}-header`}
                    sx={{
                      minHeight: 48,
                      '&.Mui-expanded': { minHeight: 48 },
                      '& .MuiAccordionSummary-content': {
                        my: 1,
                        '&.Mui-expanded': { my: 1 },
                        alignItems: 'center',
                      },
                    }}
                  >
                    <Iconify
                      icon="logos:stellar"
                      sx={{ mr: 1, color: 'primary.main', flexShrink: 0 }}
                    />
                    <Typography variant="subtitle2" sx={{ flexShrink: 0, mr: 1 }}>
                      {contract.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      ({contract.contractId.substring(0, 8)}...
                      {contract.contractId.substring(contract.contractId.length - 8)})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{ p: 2, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}
                  >
                    <Stack spacing={1}>
                      <Typography variant="caption">
                        <strong>Network:</strong> {contract.network}
                      </Typography>
                      <Typography variant="caption">
                        <strong>Deployed:</strong> {contract.timestamp}
                      </Typography>
                      {contract.txHash && (
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Typography variant="caption">
                            <strong>Tx:</strong>
                          </Typography>
                          <Link
                            href={`https://stellar.expert/explorer/${environmentStellar === 'testnet' ? 'testnet' : 'public'}/tx/${contract.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="caption"
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              wordBreak: 'break-all',
                            }}
                          >
                            {`${contract.txHash.substring(0, 6)}...${contract.txHash.substring(contract.txHash.length - 4)}`}
                            <Iconify icon="eva:external-link-fill" width={14} sx={{ ml: 0.5 }} />
                          </Link>
                        </Stack>
                      )}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </Box>
      </Stack>
    );
  };

  return (
    <Stack spacing={3} sx={{ px: 2, py: 4, flexGrow: 1 }}>
      {platform === 'evm' && renderEvmDeploy()}
      {platform === 'solana' && renderSolanaDeploy()}
      {platform === 'stellar' && renderStellarDeploy()}
    </Stack>
  );
}
