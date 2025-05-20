'use client';

import type { ProjectFile } from 'src/types/project';
import type { Compilation } from 'src/actions/project/resources';
// Import RealtimePostgresChangesPayload from supabase and Compilation from local actions
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
// Actions & Types
import type { RequestCompilationPayload } from 'src/actions/project/resources';
import type { EvmVersion, AnchorVersion, SolidityVersion } from 'src/utils/compiler';

import { useMemo, useState, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

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
  deploySolanaProgram,
  type SolanaProgramArtifacts,
  type DeploySolanaProgramResult,
} from 'src/utils/solana-deployer';

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
      walletAddress: string;
      gasLimit?: string;
      value?: string;
      valueUnit?: string;
      artifactToDeploy: ArtifactForDeploy;
    }) => {
      console.log('[ContractEditorView] Requesting EVM Deploy with config:', deployConfig);
      console.log('Selected artifact for EVM deploy:', deployConfig.artifactToDeploy);
      setIsDeploying(true);
      setTimeout(() => {
        const newDeployment: DeployedEvmContractInfo = {
          id: `deployedEvm${Date.now()}`,
          name: deployConfig.artifactToDeploy?.name || 'UnknownContract',
          address: `0x${Math.random().toString(16).substring(2, 10)}...`,
          network:
            evmEnvironments.find((e) => e.id === deployConfig.environmentId)?.name || 'Unknown',
          timestamp: new Date().toLocaleString(),
          txHash: `0x${Math.random().toString(16).substring(2, 12)}...`,
        };
        setDeployedEvmContractsList((prev) => [newDeployment, ...prev]);
        setIsDeploying(false);
        console.log('[ContractEditorView] Mock EVM contract deployed:', newDeployment);
        setExpandedEvmAccordionDeploy(newDeployment.id);
      }, 2000);
    },
    [projectId, user]
  );

  const handleRequestSolanaDeploy = useCallback(
    async (deployConfig: {
      environmentId: string;
      walletAddress: string;
      artifactToDeploy: ArtifactForDeploy;
    }) => {
      console.log('[ContractEditorView] Requesting Solana Deploy with config:', deployConfig);

      if (!deployConfig.artifactToDeploy || !deployConfig.artifactToDeploy.fullArtifacts) {
        console.error('[ContractEditorView] Artifact to deploy or fullArtifacts missing.');
        // toast.error("Artifact to deploy is missing critical information."); // Kullanıcıya bildirim eklenebilir
        setIsDeploying(false);
        return;
      }

      // Artifact'in SolanaProgramArtifacts tipine uygun olduğundan emin olalım
      const artifactsToDeploy: SolanaProgramArtifacts = {
        idl: deployConfig.artifactToDeploy.fullArtifacts.idl,
        programBinaryBase64: deployConfig.artifactToDeploy.fullArtifacts.programBinaryBase64,
        keypair: deployConfig.artifactToDeploy.fullArtifacts.keypair,
      };

      if (!artifactsToDeploy.programBinaryBase64 || !artifactsToDeploy.keypair) {
        console.error(
          '[ContractEditorView] Solana artifact is missing programBinaryBase64 or keypair.'
        );
        // toast.error("Selected Solana artifact is incomplete for deployment.");
        setIsDeploying(false);
        return;
      }

      setIsDeploying(true);

      if (deployConfig.environmentId === 'browser') {
        if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
          console.error(
            "[ContractEditorView] Solana browser wallet not connected or doesn't support signing."
          );
          // toast.error("Please connect your Solana wallet or ensure it supports transaction signing.");
          setIsDeploying(false);
          return;
        }

        // Log artifacts before sending to deployment function
        console.log(
          '[ContractEditorView] Artifacts being sent to deployment function:',
          JSON.stringify(
            artifactsToDeploy,
            (key, value) => {
              if (key === 'programBinaryBase64' && typeof value === 'string') {
                return `${value.substring(0, 30)}... (length: ${value.length})`;
              }
              if (key === 'keypair' && Array.isArray(value)) {
                return `Array(length: ${value.length}) [${value.slice(0, 5).join(', ')}...]`;
              }
              return value;
            },
            2
          )
        );

        try {
          console.log(
            '[ContractEditorView] Attempting to deploy Solana program via browser wallet...'
          );
          console.log('Artifacts for deployment:', artifactsToDeploy);
          console.log('Wallet from useWallet:', wallet);
          console.log('Connection from useConnection:', connection);

          // Normal BPF Loader program kullanıyoruz (yükseltileme özelliği olmadan)
          const result: DeploySolanaProgramResult = await deploySolanaProgram({
            artifacts: artifactsToDeploy,
            wallet,
            connection,
            onProgress: (message: string) => {
              console.log(`[SolanaDeployProgress] ${message}`);
              // UI'da ilerleme göstermek için Toast ve ilerleme durumu eklenebilir
              // toast.info(message);

              // İlerleme yüzdesi bildirimi içeriyorsa bunu özel olarak gösterebiliriz
              if (message.includes('%')) {
                const percentage = message.match(/\d+%/)?.[0] || '';
                console.log(`[SolanaDeployProgress] İlerleme: ${percentage}`);
                // Özel progress bildirimi gösterilebilir
              }
            },
          });

          // Ağ bilgisini belirle
          const network = connection.rpcEndpoint.includes('devnet')
            ? 'devnet'
            : connection.rpcEndpoint.includes('mainnet')
              ? 'mainnet'
              : connection.rpcEndpoint.includes('testnet')
                ? 'testnet'
                : 'localnet';

          console.log(
            `[ContractEditorView] Solana program başarıyla deploy edildi! Ağ: ${network}`
          );
          console.log('[ContractEditorView] Deploy sonucu:', result);

          const newDeployment: DeployedSolanaProgramInfo = {
            id: `deployedSol-${result.programId}-${Date.now()}`,
            name: deployConfig.artifactToDeploy?.name || 'UnknownProgram',
            programId: result.programId,
            network:
              wallet.wallet?.adapter?.name ||
              `${network} - ${connection.rpcEndpoint}` ||
              'Unknown Network',
            timestamp: new Date().toLocaleString(),
            txHash: result.transactionSignature,
          };

          setDeployedSolanaProgramsList((prev) => [newDeployment, ...prev]);
          setExpandedSolanaAccordionDeploy(newDeployment.id);

          // Başarı bildirimi
          // const explorerLink = `https://explorer.solana.com/address/${result.programId}?cluster=${network}`;
          // toast.success(`${newDeployment.name} programı başarıyla deploy edildi! Program ID: ${result.programId}`);
        } catch (error: any) {
          console.error(
            '[ContractEditorView] Error deploying Solana program via browser wallet:',
            error
          );

          // Hatayı analiz et ve daha açıklayıcı mesaj göster
          let errorMessage = `Solana deployment failed: ${error.message}`;

          if (error.message.includes('Budget exceeded')) {
            errorMessage = 'Program boyutu çok büyük veya transaction limitleri aşıldı.';
          } else if (error.message.includes('Blockhash not found')) {
            errorMessage = 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.';
          } else if (error.message.includes('insufficient funds')) {
            errorMessage = 'Cüzdanınızda yeterli SOL bulunmuyor.';
          }

          console.error(`[ContractEditorView] Hata detayı: ${errorMessage}`);
          // toast.error(errorMessage);
        } finally {
          setIsDeploying(false);
        }
      } else {
        // Mock veya diğer ortamlar için eski davranış (şimdilik)
        console.log(
          '[ContractEditorView] Using mock deploy for Solana environment:',
          deployConfig.environmentId
        );
        setTimeout(() => {
          const newDeployment: DeployedSolanaProgramInfo = {
            id: `deployedSol${Date.now()}`,
            name: deployConfig.artifactToDeploy?.name || 'UnknownProgram',
            programId:
              deployConfig.artifactToDeploy?.programId ||
              `Prog${Math.random().toString(16).substring(2, 10)}...`,
            network:
              solanaEnvironments.find((e) => e.id === deployConfig.environmentId)?.name ||
              'Unknown',
            timestamp: new Date().toLocaleString(),
            txHash: `${Math.random().toString(36).substring(2, 15)}...`,
          };
          setDeployedSolanaProgramsList((prev) => [newDeployment, ...prev]);
          setIsDeploying(false);
          console.log('[ContractEditorView] Mock Solana program deployed:', newDeployment);
          setExpandedSolanaAccordionDeploy(newDeployment.id);
        }, 2500);
      }
    },
    [projectId, user, connection, wallet]
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

      {isChatPanelVisible && <IdeChatPanel onClose={toggleChatPanel} />}
    </Box>
  );
}
