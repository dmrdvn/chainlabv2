import { toast } from 'sonner'; // For clipboard notifications
import React, { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
// MUI Imports (alphabetical)
import Accordion from '@mui/material/Accordion';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import FormControlLabel from '@mui/material/FormControlLabel';

// Custom Hooks & Actions/Types
import { EvmVersion, AnchorVersion, SolidityVersion } from 'src/utils/compiler';

// Custom Components
import { Iconify } from 'src/components/iconify';

import type {
  EvmCompilerSettings,
  SolanaCompilerSettings,
  SimplifiedCompilationData,
} from './view/contract-editor-view';

interface CompiledEvmContractInfo {
  name: string;
  filePath: string;
  timestamp: string;
  abi?: any[] | null;
  bytecode?: string | null;
}

const anchorVersions = [AnchorVersion.V0_28_0, AnchorVersion.V0_28_0, AnchorVersion.V0_27_0];
interface CompiledSolanaProgramInfo {
  name: string;
  programId: string;
  idlTimestamp: string;
  buildTimestamp: string;
  idl?: Record<string, any> | null;
  binaryBase64?: string | null;
}

interface IdeCompilerProps {
  platform: 'evm' | 'solana' | null;
  onCompileEvm: (settings: EvmCompilerSettings) => Promise<void>;
  onCompileSolana: (settings: SolanaCompilerSettings) => Promise<void>;
  isCompiling: boolean;
  compilationUpdate?: SimplifiedCompilationData | null;
}

export function IdeCompiler({
  platform,
  onCompileEvm,
  onCompileSolana,
  isCompiling,
  compilationUpdate,
}: IdeCompilerProps) {
  const [compilerVersion, setCompilerVersion] = useState<SolidityVersion>(SolidityVersion.LATEST);
  const [evmVersion, setEvmVersion] = useState<EvmVersion>(EvmVersion.DEFAULT);
  const [compiledEvmContract, setCompiledEvmContract] = useState<CompiledEvmContractInfo | null>(
    null
  );
  const [enableOptimization, setEnableOptimization] = useState(false);
  const [optimizationRuns, setOptimizationRuns] = useState(200);
  const [compiledEvmContractExpanded, setCompiledEvmContractExpanded] = useState<boolean>(false);
  const [anchorVersion, setAnchorVersion] = useState(anchorVersions[0]);
  const [compiledSolanaProgram, setCompiledSolanaProgram] =
    useState<CompiledSolanaProgramInfo | null>(null);
  const [compiledSolanaProgramExpanded, setCompiledSolanaProgramExpanded] =
    useState<boolean>(false);

  useEffect(() => {
    if (compilationUpdate) {
      console.log('[IdeCompiler] Received compilation update (simplified):', compilationUpdate);
      if (compilationUpdate.status === 'success' && compilationUpdate.artifacts) {
        if (platform === 'evm') {
          const artifactKeys = Object.keys(compilationUpdate.artifacts);
          const firstContractName = artifactKeys.find(
            (key) =>
              compilationUpdate.artifacts &&
              compilationUpdate.artifacts[key]?.abi &&
              compilationUpdate.artifacts[key]?.bytecode
          );

          if (firstContractName && compilationUpdate.artifacts) {
            const contractArtifact = compilationUpdate.artifacts[firstContractName];
            setCompiledEvmContract({
              name: firstContractName,
              filePath: contractArtifact?.sourceName || 'Unknown source',
              timestamp: new Date(compilationUpdate.completed_at || Date.now()).toLocaleString(),
              abi: contractArtifact.abi,
              bytecode: contractArtifact.bytecode?.object || contractArtifact.bytecode,
            });
            setCompiledEvmContractExpanded(true);
          } else {
            console.warn(
              '[IdeCompiler] Could not identify primary EVM contract artifact from:',
              compilationUpdate.artifacts
            );
            setCompiledEvmContract(null);
          }
        } else if (platform === 'solana') {
          // Adjusted Solana artifact parsing for nested structure
          const { idl, programBinaryBase64 } = compilationUpdate.artifacts;
          if (idl && idl.address && programBinaryBase64) {
            setCompiledSolanaProgram({
              name: idl.metadata?.name || 'Solana Program', // Use name from IDL metadata
              programId: idl.address, // Use address from IDL as programId
              idlTimestamp: new Date(
                idl.metadata?.createdOn || compilationUpdate.completed_at || Date.now()
              ).toLocaleString(),
              buildTimestamp: new Date(
                compilationUpdate.completed_at || Date.now()
              ).toLocaleString(),
              idl, // The full IDL object
              binaryBase64: programBinaryBase64, // The binary string
            });
            setCompiledSolanaProgramExpanded(true);
          } else {
            console.warn(
              '[IdeCompiler] Solana artifacts are not in the expected format (expected idl, idl.address, programBinaryBase64):',
              compilationUpdate.artifacts
            );
            setCompiledSolanaProgram(null);
          }
        }
      } else if (
        compilationUpdate.status === 'error' ||
        compilationUpdate.status === 'processing' ||
        compilationUpdate.status === 'queued'
      ) {
        // Platform-specific clearing of compiled state
        if (platform === 'evm') {
          setCompiledEvmContract(null);
        } else if (platform === 'solana') {
          setCompiledSolanaProgram(null);
        }
        // Optionally, if you want to collapse the accordions when a new compilation starts or fails for the current platform:
        // if (platform === 'evm') setCompiledEvmContractExpanded(false);
        // if (platform === 'solana') setCompiledSolanaProgramExpanded(false);
      }
    }
  }, [compilationUpdate, platform]);

  const handleCopyToClipboard = (text: string, type: string) => {
    if (navigator.clipboard && text) {
      navigator.clipboard
        .writeText(text)
        .then(() => toast.success(`${type} copied to clipboard!`))
        .catch((err) => toast.error(`Failed to copy ${type}.`));
    } else {
      toast.error('Clipboard not available or no content to copy.');
    }
  };

  const handleCompileEvmClick = async () => {
    setCompiledEvmContract(null);
    setCompiledEvmContractExpanded(false);

    const settings: EvmCompilerSettings = {
      compilerVersion,
      evmVersion,
      enableOptimization,
      optimizationRuns: enableOptimization ? optimizationRuns : 0,
    };
    await onCompileEvm(settings);
  };

  const handleCompileSolanaClick = async () => {
    setCompiledSolanaProgram(null);
    setCompiledSolanaProgramExpanded(false);

    const settings: SolanaCompilerSettings = {
      anchorVersion,
    };
    await onCompileSolana(settings);
  };

  const handleEvmAccordionChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    setCompiledEvmContractExpanded(isExpanded);
  };

  const handleSolanaAccordionChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    setCompiledSolanaProgramExpanded(isExpanded);
  };

  const renderEvmCompiler = () => (
    <>
      <FormControl fullWidth size="small">
        <InputLabel>Compiler</InputLabel>
        <Select
          value={compilerVersion}
          label="Compiler"
          onChange={(e) => setCompilerVersion(e.target.value as SolidityVersion)}
        >
          {(Object.values(SolidityVersion) as string[]).map((version) => (
            <MenuItem key={version} value={version}>
              {version}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth size="small">
        <InputLabel>EVM Version</InputLabel>
        <Select
          value={evmVersion}
          label="EVM Version"
          onChange={(e) => setEvmVersion(e.target.value as EvmVersion)}
        >
          {(Object.values(EvmVersion) as string[]).map((version) => (
            <MenuItem key={version} value={version}>
              {version.charAt(0).toUpperCase() + version.slice(1)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControlLabel
        control={
          <Switch
            checked={enableOptimization}
            onChange={(e) => setEnableOptimization(e.target.checked)}
            size="small"
          />
        }
        label="Enable Optimization"
        labelPlacement="start"
        sx={{ justifyContent: 'space-between', ml: 0, mr: 0.5 }}
      />
      {enableOptimization && (
        <TextField
          fullWidth
          size="small"
          type="number"
          label="Optimizer Runs"
          value={optimizationRuns}
          onChange={(e) => setOptimizationRuns(parseInt(e.target.value, 10) || 0)}
          InputLabelProps={{ shrink: true }}
          sx={{ mt: 2 }}
        />
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleCompileEvmClick}
        disabled={isCompiling}
        fullWidth
        startIcon={<Iconify icon="eos-icons:atom-electron" />}
      >
        {isCompiling &&
        compilationUpdate?.status !== 'success' &&
        compilationUpdate?.status !== 'error'
          ? 'Compiling... (this might take 10-15 seconds)'
          : 'Compile Contract'}
      </Button>

      <Box>
        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
        <Typography
          variant="subtitle1"
          gutterBottom
          sx={{
            color: 'text.primary',
            textAlign: 'center',
            fontWeight: 'bold',
            mb: 2,
          }}
        >
          Compiled Contract
        </Typography>

        {compiledEvmContract ? (
          <Accordion
            expanded={compiledEvmContractExpanded}
            onChange={handleEvmAccordionChange}
            disableGutters
            elevation={0}
            sx={{
              border: (theme) => `1px solid ${theme.palette.divider}`,
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary
              expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
              aria-controls="compiled-contract-content"
              id="compiled-contract-header"
              sx={{
                minHeight: 40,
                '&.Mui-expanded': { minHeight: 40 },
                '& .MuiAccordionSummary-content': {
                  my: 1,
                  '&.Mui-expanded': { my: 0.5 },
                },
              }}
            >
              <Iconify
                icon="healthicons:contract-document-outline"
                sx={{ mr: 1, color: 'primary.main', mt: '2px', flexShrink: 0 }}
              />
              <Typography variant="subtitle2" sx={{ flexShrink: 0 }}>
                {compiledEvmContract.name}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <Card
                variant="outlined"
                sx={{
                  border: 'none',
                  borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                  borderRadius: 0,
                }}
              >
                <CardContent sx={{ pt: 1.5, px: 2, pb: '16px !important' }}>
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mb: 0.5 }}
                      >
                        File Path
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {compiledEvmContract.filePath}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mb: 0.5 }}
                      >
                        Compiled At
                      </Typography>
                      <Typography variant="body2">{compiledEvmContract.timestamp}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button
                        sx={{ fontSize: 12 }}
                        variant="outlined"
                        startIcon={<Iconify icon="eva:copy-outline" />}
                        onClick={() =>
                          compiledEvmContract.abi &&
                          handleCopyToClipboard(
                            JSON.stringify(compiledEvmContract.abi, null, 2),
                            'ABI'
                          )
                        }
                        disabled={!compiledEvmContract.abi}
                      >
                        ABI
                      </Button>
                      <Button
                        sx={{ fontSize: 12 }}
                        variant="outlined"
                        startIcon={<Iconify icon="eva:copy-outline" />}
                        onClick={() =>
                          compiledEvmContract.bytecode &&
                          handleCopyToClipboard(compiledEvmContract.bytecode, 'Bytecode')
                        }
                        disabled={!compiledEvmContract.bytecode}
                      >
                        Bytecode
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </AccordionDetails>
          </Accordion>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            {isCompiling &&
            compilationUpdate?.status !== 'success' &&
            compilationUpdate?.status !== 'error'
              ? 'Compiling... (this might take 10-15 seconds)'
              : 'Contract not compiled yet.'}
          </Typography>
        )}
      </Box>
    </>
  );

  const renderSolanaCompiler = () => (
    <>
      <FormControl fullWidth size="small">
        <InputLabel>Anchor Version</InputLabel>
        <Select
          value={anchorVersion}
          label="Anchor Version"
          onChange={(e) => setAnchorVersion(e.target.value as AnchorVersion)}
        >
          {anchorVersions.map((version) => (
            <MenuItem key={version} value={version}>
              {version}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="contained"
        color="primary"
        onClick={handleCompileSolanaClick}
        disabled={isCompiling}
        fullWidth
        startIcon={<Iconify icon="eos-icons:atom-electron" />}
      >
        {isCompiling &&
        compilationUpdate?.status !== 'success' &&
        compilationUpdate?.status !== 'error'
          ? 'Building... (this might take 4-5 minutes)'
          : 'Build Program'}
      </Button>

      <Box>
        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
        <Typography
          variant="subtitle1"
          gutterBottom
          sx={{
            color: 'text.primary',
            textAlign: 'center',
            fontWeight: 'bold',
            mb: 2,
          }}
        >
          Build Artifacts
        </Typography>

        {compiledSolanaProgram ? (
          <Accordion
            expanded={compiledSolanaProgramExpanded}
            onChange={handleSolanaAccordionChange}
            disableGutters
            elevation={0}
            sx={{
              border: (theme) => `1px solid ${theme.palette.divider}`,
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary
              expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
              aria-controls="compiled-program-content"
              id="compiled-program-header"
              sx={{
                minHeight: 40,
                '&.Mui-expanded': { minHeight: 40 },
                '& .MuiAccordionSummary-content': {
                  my: 1,
                  '&.Mui-expanded': { my: 0.5 },
                },
              }}
            >
              <Iconify icon="logos:anchor" sx={{ mr: 1, mt: '2px', flexShrink: 0 }} />
              <Typography
                variant="subtitle2"
                sx={{
                  flexShrink: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {compiledSolanaProgram.name}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <Card
                variant="outlined"
                sx={{
                  border: 'none',
                  borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                  borderRadius: 0,
                }}
              >
                <CardContent sx={{ pt: 1.5, px: 2, pb: '16px !important' }}>
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mb: 0.5 }}
                      >
                        Program ID
                      </Typography>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography
                          variant="body2"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flexGrow: 1,
                          }}
                        >
                          {compiledSolanaProgram.programId.substring(0, 8)}...
                          {compiledSolanaProgram.programId.substring(
                            compiledSolanaProgram.programId.length - 8
                          )}
                        </Typography>
                        <Iconify
                          sx={{
                            cursor: 'pointer',
                            color: 'text.primary',
                            width: 18,
                            height: 18,
                            flexShrink: 0,
                          }}
                          icon="eva:copy-outline"
                          onClick={() =>
                            handleCopyToClipboard(compiledSolanaProgram.programId, 'Program ID')
                          }
                        />
                      </Box>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mb: 0.5 }}
                      >
                        Last Build
                      </Typography>
                      <Typography variant="body2">
                        {compiledSolanaProgram.buildTimestamp}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mb: 0.5 }}
                      >
                        IDL Generated
                      </Typography>
                      <Typography variant="body2">{compiledSolanaProgram.idlTimestamp}</Typography>
                    </Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        mt: 1,
                      }}
                    >
                      <Button
                        sx={{ fontSize: 12 }}
                        variant="outlined"
                        startIcon={<Iconify icon="eva:copy-outline" />}
                        onClick={() =>
                          compiledSolanaProgram.idl &&
                          handleCopyToClipboard(
                            JSON.stringify(compiledSolanaProgram.idl, null, 2),
                            'IDL'
                          )
                        }
                        disabled={!compiledSolanaProgram.idl}
                      >
                        IDL
                      </Button>
                      <Button
                        sx={{ fontSize: 12 }}
                        variant="outlined"
                        startIcon={<Iconify icon="eva:copy-outline" />}
                        onClick={() =>
                          compiledSolanaProgram.binaryBase64 &&
                          handleCopyToClipboard(compiledSolanaProgram.binaryBase64, 'Binary')
                        }
                        disabled={!compiledSolanaProgram.binaryBase64}
                      >
                        Binary
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </AccordionDetails>
          </Accordion>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            {isCompiling &&
            compilationUpdate?.status !== 'success' &&
            compilationUpdate?.status !== 'error'
              ? 'Building... (this might take 4-5 minutes)'
              : 'Project not built yet.'}
          </Typography>
        )}
      </Box>
    </>
  );

  return (
    <Stack
      spacing={3}
      sx={{
        px: 2,
        py: 4,
        flexGrow: 1,
      }}
    >
      {platform === 'solana' ? renderSolanaCompiler() : renderEvmCompiler()}
    </Stack>
  );
}
