'use client';

import type { ProjectFile } from 'src/types/project';
import type { Compilation } from 'src/actions/project/resources';
// Import RealtimePostgresChangesPayload from supabase and Compilation from local actions
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
// Actions & Types
import type { RequestCompilationPayload } from 'src/actions/project/resources';
import type { EvmVersion, AnchorVersion, SolidityVersion } from 'src/utils/compiler';
import { toast } from 'sonner';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { usePublicClient, useWalletClient, useAccount } from 'wagmi';

import Box from '@mui/material/Box';

import { useProjectById } from 'src/hooks/projects/use-project-queries';
// Ordered Custom Hooks
import { useCurrentProject } from 'src/hooks/projects/use-project-utils';
import { useProjectFileHierarchy } from 'src/hooks/projects/use-project-files-queries';
// Import useProjectCompilationSubscription
import {
  useRequestCompilation,
  useProjectCompilationSubscription,
} from 'src/hooks/projects/use-project-mutations';

// Utils
import { transformHierarchyToFlatProjectFiles } from 'src/utils/project-transforms';
import {
  deploySolanaProgramWithUpgradeableLoader,
  type SolanaProgramArtifacts,
  type DeploySolanaProgramResult,
} from 'src/utils/solana-deployer';
import {
  deployEvmContractWithViem,
  type ViemEvmContractArtifacts,
  type DeployViemEvmContractResult,
} from 'src/utils/ethereum-deployer';
import { parseUnits } from 'viem';

import { useAuthContext } from 'src/auth/hooks';

import IdeSidebar from '../ide-sidebar';
import IdeStatusBar from '../ide-status-bar';
import IdeChatPanel from '../ide-chat-panel';
import IdeEditorArea from '../ide-editor-area';
import { ActivityBar } from '../ide-activity-bar';

// Import deploy types
import type { DeployedEvmContractInfo, DeployedSolanaProgramInfo } from '../ide-deploy';

// Dynamically import IdePanel
/* import dynamic from 'next/dynamic';
const IdePanel = dynamic(() => import('../ide-panel'), {
  ssr: false,
  loading: () => <p>Loading Panel...</p>,
}); */

// Define SimplifiedCompilationData interface
export interface SimplifiedCompilationData {
  id: string;
  project_id: string;
  status: 'queued' | 'processing' | 'success' | 'error';
  artifacts?: Record<string, any> | null;
  started_at?: string | null;
  completed_at?: string | null;
  updated_at?: string | null;
}

interface CursorPosition {
  lineNumber: number;
  column: number;
}

// Define types for compiler settings to be passed from IdeCompiler
export interface EvmCompilerSettings {
  compilerVersion: SolidityVersion;
  evmVersion: EvmVersion;
  enableOptimization: boolean;
  optimizationRuns: number;
}

export interface SolanaCompilerSettings {
  anchorVersion: AnchorVersion;
}

// Deploy için artifact formatı
export interface ArtifactForDeploy {
  id: string; // Benzersiz ID (EVM: compilationId + contractKey, Solana: compilationId + programId)
  name: string; // Gösterilecek isim (EVM: ContractName (path), Solana: Program Name)
  platform: 'evm' | 'solana';
  fullArtifacts: Record<string, any>; // İlgili kontratın/programın tüm artifact objesi
  // EVM'e özel alanlar (opsiyonel, fullArtifacts'tan da çıkarılabilir)
  abi?: any[];
  bytecode?: string;
  constructorInputs?: { name: string; type: string }[]; // EKLENDİ: Constructor girdileri
  // Solana'ya özel alanlar (opsiyonel, fullArtifacts'tan da çıkarılabilir)
  idl?: Record<string, any>;
  programId?: string; // Solana program ID (idl.address)
  programBinaryBase64?: string;
  keypair?: number[];
}

// Mock environment data (normally from a config or ide-deploy.tsx)
const evmEnvironments = [
  { id: 'metamask', name: 'Metamask / Browser Wallet' },
  { id: 'local_hardhat', name: 'Local Hardhat Node' },
];
const solanaEnvironments = [
  { id: 'local_validator', name: 'Local Solana Validator' },
  { id: 'browser', name: 'Browser Wallet (Phantom, Solflare, etc.)' },
];

/**
 * @function ContractEditorView
 * @description Ana IDE görünümünü oluşturan React bileşenidir.
 * Activity Bar, Sidebar, Editor Area, Status Bar ve Chat Panel gibi ana UI bileşenlerini içerir ve yönetir.
 */
export default function ContractEditorView() {
  const { projectId } = useCurrentProject();
  const { user } = useAuthContext();
  const { connection } = useConnection();
  const wallet = useWallet();

  // EVM için wagmi hookları
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { address: accountAddress, chain: currentChain } = useAccount();

  const [activeView, setActiveView] = useState('explorer');
  const [isChatPanelVisible, setIsChatPanelVisible] = useState(false);
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const [isPanelVisible, setIsPanelVisible] = useState<boolean>(false);
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
    lineNumber: 1,
    column: 1,
  });
  const [openEditorFiles, setOpenEditorFiles] = useState<ProjectFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  // --- Compilation States ---
  const [isSubscribingToCompilations, setIsSubscribingToCompilations] = useState(false);
  const [activeCompilationId, setActiveCompilationId] = useState<string | null>(null);
  const [fullCompilationData, setFullCompilationData] = useState<Compilation | null>(null);
  const [availableArtifactsForDeploy, setAvailableArtifactsForDeploy] = useState<
    ArtifactForDeploy[]
  >([]);

  // --- Deployment States ---
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedEvmContractsList, setDeployedEvmContractsList] = useState<
    DeployedEvmContractInfo[]
  >([]);
  const [deployedSolanaProgramsList, setDeployedSolanaProgramsList] = useState<
    DeployedSolanaProgramInfo[]
  >([]);
  const [expandedEvmAccordionDeploy, setExpandedEvmAccordionDeploy] = useState<string | false>(
    false
  );
  const [expandedSolanaAccordionDeploy, setExpandedSolanaAccordionDeploy] = useState<
    string | false
  >(false);

  const {
    project: currentProjectDetails,
    projectLoading: currentProjectLoading,
    projectError: currentProjectError,
  } = useProjectById(projectId ?? null);

  const {
    hierarchy: currentProjectHierarchy,
    hierarchyLoading,
    hierarchyError,
    refreshHierarchy: mutateProjectFileHierarchy,
  } = useProjectFileHierarchy(projectId ?? null);

  // --- Compilation Logic & Subscription ---
  const handleCompilationDataChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Compilation>) => {
      console.log('[ContractEditorView] Full compilation data change RECEIVED:', payload);
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        const updatedCompilation = payload.new;
        if (updatedCompilation && updatedCompilation.id === activeCompilationId) {
          setFullCompilationData(updatedCompilation);

          if (updatedCompilation.status === 'success' && updatedCompilation.artifacts) {
            console.log(
              '[ContractEditorView] Compilation successful, processing artifacts for deploy:',
              updatedCompilation.artifacts
            );
            const newArtifactsForDeploy: ArtifactForDeploy[] = [];
            if (currentProjectDetails?.platform === 'evm') {
              Object.entries(updatedCompilation.artifacts).forEach(
                ([contractKey, artifactData]) => {
                  if (
                    typeof artifactData === 'object' &&
                    artifactData !== null &&
                    artifactData.abi &&
                    artifactData.bytecode
                  ) {
                    // ContractName (contracts/MyToken.sol)
                    const nameParts = contractKey.split(':');
                    const contractFileName = nameParts[0];
                    const contractName = nameParts.length > 1 ? nameParts[1] : contractFileName;

                    // Constructor girdilerini ABI'dan çıkar
                    let constructorInputs: { name: string; type: string }[] = [];
                    if (Array.isArray(artifactData.abi)) {
                      const constructorAbiEntry = artifactData.abi.find(
                        (entry: any) => entry.type === 'constructor'
                      );
                      if (constructorAbiEntry && Array.isArray(constructorAbiEntry.inputs)) {
                        constructorInputs = constructorAbiEntry.inputs.map((input: any) => ({
                          name: input.name || '', // Bazen name olmayabilir, boş string ata
                          type: input.type || 'unknown',
                        }));
                      }
                    }

                    newArtifactsForDeploy.push({
                      id: `${updatedCompilation.id}-${contractKey}`,
                      name: `${contractName} (${contractFileName})`,
                      platform: 'evm',
                      fullArtifacts: artifactData,
                      abi: artifactData.abi,
                      bytecode:
                        typeof artifactData.bytecode === 'string'
                          ? artifactData.bytecode
                          : artifactData.bytecode?.object,
                      constructorInputs, // Eklendi
                    });
                  }
                }
              );
            } else if (currentProjectDetails?.platform === 'solana') {
              const { idl, programBinaryBase64, keypair } = updatedCompilation.artifacts as any; // Cast for easier access
              if (idl && idl.address && idl.metadata?.name && programBinaryBase64) {
                newArtifactsForDeploy.push({
                  id: `${updatedCompilation.id}-${idl.address}`,
                  name: idl.metadata.name,
                  platform: 'solana',
                  fullArtifacts: updatedCompilation.artifacts,
                  idl,
                  programId: idl.address,
                  programBinaryBase64,
                  keypair,
                });
              }
            }
            setAvailableArtifactsForDeploy((prev) =>
              [...prev, ...newArtifactsForDeploy].filter(
                (v, i, a) => a.findIndex((t) => t.id === v.id) === i
              )
            ); // Add new, prevent duplicates
            console.log(
              '[ContractEditorView] Updated availableArtifactsForDeploy:',
              availableArtifactsForDeploy
            );
          }

          if (updatedCompilation.status === 'success' || updatedCompilation.status === 'error') {
            console.log(
              `[ContractEditorView] Compilation ${updatedCompilation.status}. Disabling subscription if not processing more.`
            );
            const message =
              updatedCompilation.status === 'success'
                ? `EVM Contract compilation successful for project: ${currentProjectDetails?.name || 'Unknown Project'}`
                : `EVM Contract compilation failed for project: ${currentProjectDetails?.name || 'Unknown Project'}. Check logs for details.`;
            toast[updatedCompilation.status](message, { duration: 5000 });

            // Potentially check if there are other active compilations before disabling
            // For now, disable if this one is done.
            // setIsSubscribingToCompilations(false);
            // setActiveCompilationId(null); // Keep for display, clear on new request
          }
        }
      }
    },
    [activeCompilationId, currentProjectDetails?.platform, availableArtifactsForDeploy]
  );

  const handleSubscriptionStatusChange = useCallback((status: string, error?: Error) => {
    console.log(`[ContractEditorView] Subscription status: ${status}`);
    if (error) {
      console.error(`[ContractEditorView] Subscription error:`, error);
    }
  }, []);

  useProjectCompilationSubscription({
    projectId,
    onDataChange: handleCompilationDataChange,
    onSubscriptionStatusChange: handleSubscriptionStatusChange,
    enabled: isSubscribingToCompilations && !!activeCompilationId,
  });

  const {
    requestCompilation,
    loading: isRequestingCompilationGlobal,
    error: requestCompilationErrorGlobal,
  } = useRequestCompilation();

  const handleRequestEvmCompilation = useCallback(
    async (settings: EvmCompilerSettings) => {
      if (!projectId || !user) return;
      console.log('[ContractEditorView] Requesting EVM compilation with settings:', settings);
      setFullCompilationData(null);
      setActiveCompilationId(null);
      setAvailableArtifactsForDeploy([]); // Clear previous artifacts for deploy

      const payload: RequestCompilationPayload = {
        projectId,
        userId: user.id,
        compilerVersion: settings.compilerVersion,
        targetVersion: settings.evmVersion,
        optimizerSettings: {
          enabled: settings.enableOptimization,
          runs: settings.enableOptimization ? settings.optimizationRuns : undefined,
        },
      };
      const result = await requestCompilation(payload);
      if (result && result.compilation_id) {
        setActiveCompilationId(result.compilation_id);
        setIsSubscribingToCompilations(true);
      } else {
        setIsSubscribingToCompilations(false);
      }
    },
    [projectId, user, requestCompilation]
  );

  const handleRequestSolanaCompilation = useCallback(
    async (settings: SolanaCompilerSettings) => {
      if (!projectId || !user) return;
      console.log('[ContractEditorView] Requesting Solana compilation with settings:', settings);
      setFullCompilationData(null);
      setActiveCompilationId(null);
      setAvailableArtifactsForDeploy([]); // Clear previous artifacts for deploy

      const payload: RequestCompilationPayload = {
        projectId,
        userId: user.id,
        compilerVersion: settings.anchorVersion,
      };
      const result = await requestCompilation(payload);
      if (result && result.compilation_id) {
        setActiveCompilationId(result.compilation_id);
        setIsSubscribingToCompilations(true);
      } else {
        setIsSubscribingToCompilations(false);
      }
    },
    [projectId, user, requestCompilation]
  );
  // --- End of Compilation Logic & Subscription ---

  // --- Deployment Logic ---
  const handleRequestEvmDeploy = useCallback(
    async (deployConfig: {
      environmentId: string;
      // walletAddress artık doğrudan walletClient'tan gelecek
      gasLimit?: string; // string olarak gelebilir, bigint'e çevrilecek
      value?: string; // string olarak gelebilir, bigint'e çevrilecek
      valueUnit?: string; // value varsa bu da olmalı (ether, gwei, wei)
      artifactToDeploy: ArtifactForDeploy;
      constructorArgs?: any[]; // Eklendi: Constructor argümanları
    }) => {
      console.log('[ContractEditorView] Requesting EVM Deploy with config:', deployConfig);

      if (
        !deployConfig.artifactToDeploy?.fullArtifacts?.abi ||
        !deployConfig.artifactToDeploy?.fullArtifacts?.bytecode
      ) {
        toast.error('Cannot deploy: Contract ABI or bytecode is missing.');
        setIsDeploying(false);
        return;
      }

      if (deployConfig.environmentId === 'metamask' || deployConfig.environmentId === 'browser') {
        if (!walletClient) {
          toast.error('Please connect your EVM wallet (e.g., MetaMask).');
          setIsDeploying(false);
          return;
        }
        if (!publicClient) {
          toast.error('Public client not available. Cannot confirm deployment.');
          setIsDeploying(false);
          return;
        }

        setIsDeploying(true);

        const artifacts: ViemEvmContractArtifacts = {
          abi: deployConfig.artifactToDeploy.fullArtifacts.abi,
          bytecode: deployConfig.artifactToDeploy.fullArtifacts.bytecode.startsWith('0x')
            ? deployConfig.artifactToDeploy.fullArtifacts.bytecode
            : `0x${deployConfig.artifactToDeploy.fullArtifacts.bytecode}`,
          contractName: deployConfig.artifactToDeploy.name,
        };

        let deployValue: bigint | undefined;
        if (deployConfig.value && deployConfig.valueUnit) {
          try {
            let decimals = 18; // Default to ether
            if (deployConfig.valueUnit.toLowerCase() === 'gwei') {
              decimals = 9;
            } else if (deployConfig.valueUnit.toLowerCase() === 'wei') {
              decimals = 0;
            }
            // Değeri parseUnits ile çevir
            deployValue = parseUnits(deployConfig.value, decimals);
          } catch (e) {
            console.error('[ContractEditorView] Error parsing value for deployment:', e);
            toast.error(
              `Invalid value or unit for deployment: ${deployConfig.value} ${deployConfig.valueUnit}`
            );
            setIsDeploying(false);
            return;
          }
        }

        try {
          const onProgress = (message: string) => {
            console.log(`[EvmDeployProgress] ${message}`);
            // Sadece belirli, kullanıcı için anlamlı ve uzun sürebilecek adımlarda toast göster
            if (
              message.toLowerCase().includes('waiting for transaction to be mined') ||
              message.toLowerCase().includes('sending deployment transaction')
            ) {
              const shortMessage =
                message.length > 100 ? `${message.substring(0, 97)}...` : message;
              toast.info(shortMessage, {
                duration:
                  message.includes('Success') ||
                  message.includes('Error') ||
                  message.includes('failed')
                    ? 5000
                    : 3000,
              });
            }
          };

          onProgress('Preparing to deploy EVM contract...');

          const result: DeployViemEvmContractResult = await deployEvmContractWithViem({
            artifacts,
            walletClient,
            publicClient,
            onProgress,
            constructorArgs: deployConfig.constructorArgs || [],
            gas: deployConfig.gasLimit ? BigInt(deployConfig.gasLimit) : undefined,
            value: deployValue,
            account: walletClient.account, // WalletClient zaten account içerir ama emin olmak için
          });

          const newDeployment: DeployedEvmContractInfo = {
            id: `deployedEvm-${Date.now()}`,
            name: result.contractName || deployConfig.artifactToDeploy.name,
            address: result.contractAddress,
            network: publicClient.chain.name || 'Unknown EVM Network',
            timestamp: new Date().toLocaleString(),
            txHash: result.transactionHash,
            blockNumber: result.blockNumber ? Number(result.blockNumber) : undefined,
            blockExplorerUrl: publicClient.chain.blockExplorers?.default?.url,
          };

          setDeployedEvmContractsList((prev) => [newDeployment, ...prev]);
          toast.success(
            `${newDeployment.name} deployed to ${newDeployment.address.substring(0, 6)}... Tx: ${newDeployment.txHash ? newDeployment.txHash.substring(0, 10) : 'N/A'}...`
          );
          setExpandedEvmAccordionDeploy(newDeployment.id);
        } catch (error: any) {
          console.error('[ContractEditorView] Error deploying EVM contract with viem:', error);
          toast.error(`EVM deployment failed: ${error.message || 'Unknown error'}`);
        } finally {
          setIsDeploying(false);
        }
      } else {
        toast.error(
          'Deployment for this EVM environment is not yet supported with viem or is misconfigured.'
        );
        setIsDeploying(false);
      }
    },
    [walletClient, publicClient, projectId, user] // Bağımlılıklara walletClient ve publicClient eklendi
  );

  const handleRequestSolanaDeploy = useCallback(
    async (deployConfig: {
      environmentId: string;
      // walletAddress artık doğrudan kullanılmayabilir, wallet objesi yeterli
      artifactToDeploy: ArtifactForDeploy;
    }) => {
      console.log('[ContractEditorView] Requesting Solana Deploy with config:', deployConfig);
      console.log('Selected artifact for Solana deploy:', deployConfig.artifactToDeploy);
      setIsDeploying(true);

      if (
        !deployConfig.artifactToDeploy ||
        !deployConfig.artifactToDeploy.fullArtifacts ||
        !deployConfig.artifactToDeploy.fullArtifacts.programBinaryBase64 ||
        !deployConfig.artifactToDeploy.fullArtifacts.keypair ||
        !deployConfig.artifactToDeploy.fullArtifacts.idl
      ) {
        console.error(
          '[ContractEditorView] Invalid or incomplete artifacts for Solana deployment.'
        );
        toast.error('Cannot deploy: Program artifacts are incomplete.');
        setIsDeploying(false);
        return;
      }

      if (deployConfig.environmentId === 'browser') {
        // Şimdilik sadece browser wallet ile deploy'a odaklanalım
        if (
          !wallet.connected ||
          !wallet.publicKey ||
          !wallet.signTransaction ||
          !wallet.signAllTransactions
        ) {
          // signAllTransactions kontrolü önemli
          console.error(
            "[ContractEditorView] Solana browser wallet not connected or doesn't support required signing methods."
          );
          toast.error(
            'Please connect your Solana wallet and ensure it supports all required signing methods.'
          );
          setIsDeploying(false);
          return;
        }

        const artifactsToDeploy: SolanaProgramArtifacts = {
          idl: deployConfig.artifactToDeploy.fullArtifacts.idl,
          programBinaryBase64: deployConfig.artifactToDeploy.fullArtifacts.programBinaryBase64,
          keypair: deployConfig.artifactToDeploy.fullArtifacts.keypair,
        };

        try {
          toast.info('Attempting to deploy Solana program (upgradeable) via browser wallet...');

          const result: DeploySolanaProgramResult = await deploySolanaProgramWithUpgradeableLoader({
            artifacts: artifactsToDeploy,
            wallet, // Tüm wallet state objesini geçiriyoruz
            connection,
          });

          // ... (başarı sonrası işlemler: setDeployedSolanaProgramsList vb. aynı kalır) ...
          toast.success(
            `${result.programId} deployed successfully! Tx: ${result.transactionSignature.substring(0, 10)}...`
          );
        } catch (error: any) {
          console.error(
            '[ContractEditorView] Error deploying Solana program (upgradeable):',
            error
          );
          toast.error(`Solana deployment failed: ${error.message || 'Unknown error'}`);
        } finally {
          setIsDeploying(false);
        }
      } else {
        toast.error(
          'Deployment for this Solana environment is currently only supported via browser wallet with the new loader.'
        );
        setIsDeploying(false);
      }
    },
    [connection, wallet] // Diğer bağımlılıklar (onProgress vb.) eklenebilir
  );

  const handleEvmDeployAccordionChange = useCallback((panel: string, isExpanded: boolean) => {
    setExpandedEvmAccordionDeploy(isExpanded ? panel : false);
  }, []);

  const handleSolanaDeployAccordionChange = useCallback((panel: string, isExpanded: boolean) => {
    setExpandedSolanaAccordionDeploy(isExpanded ? panel : false);
  }, []);
  // --- End of Deployment Logic ---

  // Create simplified data for the compiler view
  const simplifiedCompilationForIde: SimplifiedCompilationData | null = useMemo(() => {
    if (!fullCompilationData) return null;
    return {
      id: fullCompilationData.id,
      project_id: fullCompilationData.project_id,
      status: fullCompilationData.status,
      artifacts: fullCompilationData.artifacts,
      started_at: fullCompilationData.started_at,
      completed_at: fullCompilationData.completed_at,
      updated_at: fullCompilationData.updated_at,
    };
  }, [fullCompilationData]);

  const transformedFiles = useMemo(() => {
    if (currentProjectHierarchy && projectId) {
      return transformHierarchyToFlatProjectFiles(currentProjectHierarchy, projectId);
    }
    return [];
  }, [currentProjectHierarchy, projectId]);

  const activeFileNameForStatusbar = useMemo(() => {
    if (!activeFileId) return null;
    const activeFile = transformedFiles.find((f) => f.id === activeFileId);
    return activeFile ? activeFile.file_name : null;
  }, [activeFileId, transformedFiles]);

  const currentProjectName = useMemo(
    () =>
      currentProjectDetails?.name ||
      (projectId ? `Project (${projectId.slice(0, 8)}...)` : 'No Project Selected'),
    [currentProjectDetails, projectId]
  );

  const handleTogglePanel = useCallback(() => {
    setIsPanelVisible((prev) => !prev);
  }, []);

  const handlePanelVisibilityChange = useCallback((isVisible: boolean) => {
    setIsPanelVisible(isVisible);
  }, []);

  const toggleChatPanel = useCallback(() => {
    setIsChatPanelVisible((prev: boolean) => !prev);
  }, []);

  const handleActiveFileChange = useCallback((fileId: string | null) => {
    setActiveFileId(fileId);
  }, []);

  const handleChangeView = useCallback((view: string) => {
    setActiveView(view);
  }, []);

  const handleFileSelect = useCallback(
    (selectedFile: ProjectFile) => {
      setActiveFileId(selectedFile.id);
      // Add to open files if not already open and is a file (not directory)
      if (!selectedFile.is_directory && !openEditorFiles.find((f) => f.id === selectedFile.id)) {
        setOpenEditorFiles((prevOpenFiles) => [...prevOpenFiles, selectedFile]);
      }
    },
    [openEditorFiles]
  );

  const handleCloseEditorTab = useCallback(
    (fileIdToClose: string) => {
      setOpenEditorFiles((prevOpenFiles) => prevOpenFiles.filter((f) => f.id !== fileIdToClose));
      if (activeFileId === fileIdToClose) {
        const remainingFiles = openEditorFiles.filter((f) => f.id !== fileIdToClose);
        setActiveFileId(
          remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1].id : null
        );
      }
    },
    [activeFileId, openEditorFiles]
  );
  const handleEditorTabChange = useCallback(
    (event: React.SyntheticEvent, newFileId: string | null) => {
      setActiveFileId(newFileId);
    },
    []
  );

  // Yükleme ve hata durumları için basit bir gösterim
  if (currentProjectLoading || hierarchyLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        Loading IDE...
      </Box>
    );
  }

  if (currentProjectError) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        Error loading project: {currentProjectError.message}
      </Box>
    );
  }

  if (hierarchyError) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        Error loading project files: {hierarchyError.message}
      </Box>
    );
  }

  if (!currentProjectDetails || !currentProjectHierarchy) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        Project data or files not found.
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: 'calc(100vh - 40px)',
        display: 'flex',
        overflow: 'hidden',
        flexDirection: 'row',
      }}
    >
      <ActivityBar activeView={activeView} onChangeView={handleChangeView} />

      {isSidebarVisible && (
        <IdeSidebar
          activeView={activeView}
          files={transformedFiles}
          onFileSelect={handleFileSelect}
          isLoading={hierarchyLoading}
          platform={currentProjectDetails?.platform}
          onCompileEvm={handleRequestEvmCompilation}
          onCompileSolana={handleRequestSolanaCompilation}
          isCompiling={isRequestingCompilationGlobal || isSubscribingToCompilations}
          simplifiedCompilationData={simplifiedCompilationForIde}
          onDeployEvm={handleRequestEvmDeploy}
          onDeploySolana={handleRequestSolanaDeploy}
          isDeploying={isDeploying}
          deployedEvmContracts={deployedEvmContractsList}
          deployedSolanaPrograms={deployedSolanaProgramsList}
          expandedEvmAccordion={expandedEvmAccordionDeploy}
          onEvmAccordionChange={handleEvmDeployAccordionChange}
          expandedSolanaAccordion={expandedSolanaAccordionDeploy}
          onSolanaAccordionChange={handleSolanaDeployAccordionChange}
          compiledArtifactsForDeploy={availableArtifactsForDeploy}
        />
      )}

      {/* Middle Area: Editor + Status Bar */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <IdeEditorArea
          activeFileId={activeFileId}
          openFiles={openEditorFiles}
          onCloseTab={handleCloseEditorTab}
          onTabChange={handleEditorTabChange}
          onCursorPositionChange={setCursorPosition}
        />

        {/* Conditionally render the bottom panel */}
        {/*  {isPanelVisible && (
          <IdePanel
            isVisible={isPanelVisible}
            initialHeight="220px" // Set initial panel height
            onHidePanel={() => handlePanelVisibilityChange(false)} // Pass the hide function specifically
            isReady={isReady}
            status={status}
            outputs={outputs}
            runCommand={terminalRunCommand}
            clearTerminal={clearTerminal}
          />
        )} */}

        <IdeStatusBar
          projectName={currentProjectName || 'Untitled Project'}
          activeFileName={activeFileNameForStatusbar}
          lineNumber={cursorPosition.lineNumber}
          columnNumber={cursorPosition.column}
          onToggleChat={toggleChatPanel}
          onActiveFileChange={handleActiveFileChange}
          onTogglePanel={handleTogglePanel}
        />
      </Box>

      {isChatPanelVisible && (
        <IdeChatPanel
          onClose={toggleChatPanel}
          projectName={currentProjectName || 'Untitled Project'}
          allProjectFiles={transformedFiles}
          activeEditorFileId={activeFileId}
          openEditorFiles={openEditorFiles}
          platform={currentProjectDetails?.platform ?? undefined}
          lastCompilationResult={simplifiedCompilationForIde}
          isCompiling={isRequestingCompilationGlobal || isSubscribingToCompilations}
        />
      )}
    </Box>
  );
}
