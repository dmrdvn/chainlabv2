import React, { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import ToggleButton from '@mui/material/ToggleButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { toast } from 'sonner';
import { Iconify } from 'src/components/iconify';
import { keyframes } from '@mui/system';
import Tooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExpandingActionsButton from 'src/components/expanding-actions-button';

import Editor, { Monaco, loader } from '@monaco-editor/react';
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import { defineMonacoThemes, getEditorTheme } from 'src/components/monaco-editor/theme';
import { registerLanguages } from 'src/components/monaco-editor/languages';

// AI Modülleri
import type { ChatMessage } from 'src/ai/core/types';
import { llmService } from 'src/ai/core/llm-service';
import { buildChatPrompt } from 'src/ai/core/prompt-builder';
// import { parseLLMResponse } from "src/ai/core/response-parser";

// Hook
import { useProjectFileContent } from 'src/hooks/projects/use-project-files-queries';

import type { ProjectFile } from 'src/types/project';
import type { SimplifiedCompilationData } from 'src/sections/contract-editor/view/contract-editor-view';

const REPLICA_UUID_FROM_ENV = process.env.NEXT_PUBLIC_REPLICA_UUID || '';
const SENSAY_DYNAMIC_MODEL_ID = REPLICA_UUID_FROM_ENV ? `sensay-${REPLICA_UUID_FROM_ENV}` : null;

const REPLICA2_UUID_FROM_ENV = process.env.NEXT_PUBLIC_REPLICA2_UUID || '';
const SENSAY_AUDITOR_MODEL_ID = REPLICA2_UUID_FROM_ENV ? `sensay-${REPLICA2_UUID_FROM_ENV}` : null;

// Dalga animasyonu için keyframes
const wave = keyframes`
  0%, 60%, 100% {
    transform: initial;
  }
  30% {
    transform: translateY(-7px);
  }
`;

interface IdeChatPanelProps {
  onClose?: () => void;
  projectName?: string;
  allProjectFiles?: ProjectFile[]; // Tüm proje dosyaları (transformedFiles)
  activeEditorFileId?: string | null; // Aktif dosyanın ID'si (activeFileId)
  openEditorFiles?: ProjectFile[]; // Editörde açık olan dosyalar
  platform?: 'evm' | 'solana' | string; // Proje platformu
  lastCompilationResult?: SimplifiedCompilationData | null; // Son derleme sonucu
  isCompiling?: boolean; // Derleme yapılıyor mu?
}

type LLMModelType =
  | 'gpt-4o'
  | 'gpt-3.5-turbo'
  | 'claude-3.5-sonnet'
  | 'claude-3.7-sonnet'
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  // Sensay model ID'leri dinamik olduğu için burada listelenmeyecek,
  // ancak Select bileşeninin değeri bu stringlerden biri olabilir.
  | string; // Dinamik Sensay ID'lerini kapsamak için genişletiyoruz

// LLM'ler için açıklamalar (sadece statik olanlar için)
const llmDescriptions: Partial<Record<LLMModelType, string>> = {
  // Partial yaptık
  'gpt-4o': 'OpenAI: Latest flagship model, great for complex tasks, reasoning, and chat.',
  'gpt-3.5-turbo': 'OpenAI: Fast and cost-effective model, good for general tasks and chat.',
  'claude-3.5-sonnet': 'Anthropic: Strong performance for its size, excels at reasoning and chat.',
  'claude-3.7-sonnet': 'Anthropic: Next-gen model with improved capabilities.',
  'gemini-2.5-pro': 'Google: Highly capable multimodal model with a long context window.',
  'gemini-2.5-flash': 'Google: Fast and versatile multimodal model for various tasks.',
};

export default function IdeChatPanel({
  onClose,
  projectName,
  allProjectFiles,
  activeEditorFileId,
  openEditorFiles,
  platform,
  lastCompilationResult,
  isCompiling,
}: IdeChatPanelProps) {
  const theme = useTheme();
  const initialSelectedLlm = SENSAY_DYNAMIC_MODEL_ID || 'gpt-4o';
  const [selectedLlm, setSelectedLlm] = useState<LLMModelType>(initialSelectedLlm as LLMModelType);
  const [inputText, setInputText] = useState('');
  const [chatMode, setChatMode] = useState<'assistant' | 'support'>('support');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: uuidv4(),
      role: 'assistant',
      content:
        "Hello! I'm your AI assistant for Web3 development. How can I help you with your project today?",
      timestamp: new Date().toISOString(),
      status: 'completed',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFileContent, setActiveFileContent] = useState<string | null>(null);

  const messagesEndRef = useRef<null | HTMLDivElement>(null); // Otomatik scroll için
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const { file: activeEditorFileData, fileLoading: isActiveFileContentLoading } =
    useProjectFileContent(activeEditorFileId ?? null);

  useEffect(() => {
    if (activeEditorFileData && activeEditorFileData.content !== undefined) {
      setActiveFileContent(activeEditorFileData.content);
    } else {
      setActiveFileContent(null);
    }
  }, [activeEditorFileData, activeEditorFileId]);

  const handleMonacoEditorBeforeMount = (monacoInstance: Monaco) => {
    defineMonacoThemes(monacoInstance, theme);
    registerLanguages(monacoInstance);
  };

  const handleMonacoEditorDidMount = (editor: monacoEditor.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    const adjustEditorHeight = () => {
      if (editorRef.current) {
        const contentHeight = editorRef.current.getContentHeight();
        const newHeight = contentHeight;
        editorRef.current.layout({
          height: newHeight,
          width: editorRef.current.getLayoutInfo().width,
        });
      }
    };

    adjustEditorHeight();

    const disposable = editor.onDidContentSizeChange(adjustEditorHeight);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleLlmChange = (event: SelectChangeEvent<LLMModelType>) => {
    setSelectedLlm(event.target.value as LLMModelType);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
  };

  const handleModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'assistant' | 'support' | null
  ) => {
    if (newMode !== null) {
      setChatMode(newMode);
      if (newMode === 'assistant') {
        toast.info('Assistant mode is under development and will be enabled soon.');
        setChatMode('support');
      }
    }
  };

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: inputText,
      timestamp: new Date().toISOString(),
      status: 'completed',
    };

    setChatMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputText('');
    setIsLoading(true);
    setError(null);

    const assistantPlaceHolderId = uuidv4();
    setChatMessages((prevMessages) => [
      ...prevMessages,
      {
        id: assistantPlaceHolderId,
        role: 'assistant',
        content: 'PENDING_PLACEHOLDER',
        timestamp: new Date().toISOString(),
        status: 'pending_response',
      },
    ]);

    try {
      const historyForPrompt = chatMessages.filter(
        (msg) => msg.id !== assistantPlaceHolderId && msg.role !== 'system'
      );

      const activeFileForContext = activeEditorFileData
        ? {
            path: activeEditorFileData.file_path,
            content:
              activeFileContent ||
              activeEditorFileData.content ||
              '// File content not available or not loaded',
          }
        : null;

      const promptOptions = {
        mode: chatMode,
        userMessageContent: userMessage.content,
        history: historyForPrompt,
        projectContext: {
          projectName: projectName,
          platform: platform || 'unknown',
          fileSystem: {
            allFiles:
              allProjectFiles?.map((file) => ({
                path: file.file_path,
                content:
                  file.id === activeEditorFileId && activeFileForContext
                    ? activeFileForContext.content
                    : file.content || '// File content not available or not loaded from props',
              })) || [],
            openFiles:
              openEditorFiles?.map((file) => ({
                path: file.file_path,
                content:
                  file.id === activeEditorFileId && activeFileForContext
                    ? activeFileForContext.content
                    : file.content || '// File content not available or not loaded from props',
              })) || [],
            activeFile: activeFileForContext,
          },
          compilationSummary: lastCompilationResult
            ? {
                status: lastCompilationResult.status,
                message:
                  lastCompilationResult.status === 'success'
                    ? 'Last compilation was successful.'
                    : lastCompilationResult.status === 'error'
                      ? `Last compilation failed. Review compiler output for details.`
                      : `Compilation status: ${lastCompilationResult.status}`,
                artifacts: lastCompilationResult.artifacts,
              }
            : {
                status: 'not_compiled',
                message: 'The project has not been compiled yet.',
              },
          isCompiling: !!isCompiling,
        },
      };

      const promptMessages = buildChatPrompt(promptOptions);

      const llmResponse = await llmService.sendMessage(promptMessages, selectedLlm);

      const assistantMessage: ChatMessage = {
        id: assistantPlaceHolderId,
        role: 'assistant',
        content: llmResponse.content,
        timestamp: new Date().toISOString(),
        status: 'completed',
      };

      setChatMessages((prevMessages) =>
        prevMessages.map((msg) => (msg.id === assistantPlaceHolderId ? assistantMessage : msg))
      );
    } catch (err: any) {
      console.error('Error sending message to LLM:', err);
      const errorMessage = err.message || 'An unexpected error occurred.';
      setError(errorMessage);
      const errorResponseMessage: ChatMessage = {
        id: assistantPlaceHolderId,
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
        status: 'error',
      };
      setChatMessages((prevMessages) =>
        prevMessages.map((msg) => (msg.id === assistantPlaceHolderId ? errorResponseMessage : msg))
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    inputText,
    chatMessages,
    chatMode,
    selectedLlm,
    projectName,
    allProjectFiles,
    activeEditorFileId,
    openEditorFiles,
    platform,
    lastCompilationResult,
    isCompiling,
    activeFileContent,
    activeEditorFileData,
  ]);

  return (
    <Box
      sx={{
        width: 320,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderLeft: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 1,
          py: 2.5,
          height: '50px',
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', pl: 1, flexGrow: 1 }}>
          AI Assistant
        </Typography>
        {onClose && (
          <IconButton onClick={onClose} size="small" sx={{ ml: 1 }}>
            <Iconify icon="mdi:close" width={20} />
          </IconButton>
        )}
      </Box>

      {/* Mesaj Alanı */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {chatMessages.map((msg) => (
          <Paper
            key={msg.id}
            elevation={0}
            sx={{
              p: msg.role === 'assistant' && msg.content.startsWith('```') ? 0 : 1.5,
              mb: 1.5,
              bgcolor:
                msg.role === 'assistant'
                  ? theme.palette.action.hover
                  : theme.palette.background.default,
              borderRadius: 1,
              maxWidth: '95%',
              ml: msg.role === 'assistant' ? 0 : 'auto',
              mr: msg.role === 'user' ? 0 : 'auto',
              opacity: msg.status === 'pending_response' ? 0.7 : 1,
              position: 'relative',
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{
                position: 'absolute',
                top: theme.spacing(1),
                left: theme.spacing(1), // Padding azaltıldı
                right: theme.spacing(1), // Padding azaltıldı
                zIndex: 1,
              }}
            >
              {msg.timestamp && (
                <Typography
                  variant="caption"
                  sx={{ fontSize: '0.6rem', color: 'text.disabled', lineHeight: 1 }}
                  title={new Date(msg.timestamp).toLocaleString()}
                >
                  {new Date(msg.timestamp).toLocaleDateString([], {
                    day: '2-digit',
                    month: '2-digit',
                  })}{' '}
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              )}
              {!msg.timestamp && <Box sx={{ flexGrow: 1 }} />}
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.6rem',
                  color: 'text.disabled',
                  cursor: 'help',
                  lineHeight: 1,
                  mx: 1,
                  textAlign: 'center',
                  flexGrow: msg.timestamp ? 0 : 1,
                }}
                title={msg.id}
              >
                ID: {msg.id.substring(0, 20)}...
              </Typography>

              {!(msg.role === 'assistant' && msg.content.includes('```')) &&
                msg.status !== 'error' && (
                  <IconButton
                    size="small"
                    title="Copy message"
                    onClick={() => {
                      navigator.clipboard.writeText(msg.content);
                    }}
                    sx={{
                      p: 0.25,
                      color: 'text.secondary',
                      '&:hover': { bgcolor: 'action.selected' },
                    }}
                  >
                    <Iconify icon="mdi:content-copy" width={13} />
                  </IconButton>
                )}
            </Stack>

            <Box
              sx={{
                pt: theme.spacing(2), // Üst bandın yüksekliği için her zaman padding
                pb: theme.spacing(0), // Alt padding azaltıldı
                px: theme.spacing(0), // Sağ/sol padding azaltıldı
              }}
            >
              {msg.role === 'assistant' &&
              msg.status === 'pending_response' &&
              msg.content === 'PENDING_PLACEHOLDER' ? (
                <Box sx={{ display: 'flex', alignItems: 'center', p: 1, pl: 0 }}>
                  <Box
                    component="span"
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.text.secondary,
                      display: 'inline-block',
                      animation: `${wave} 1.3s ease-in-out infinite`,
                      mx: 0.5, // Noktalar arası boşluk
                    }}
                  />
                  <Box
                    component="span"
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.text.secondary,
                      display: 'inline-block',
                      animation: `${wave} 1.3s ease-in-out infinite`,
                      animationDelay: '0.2s', // İkinci nokta için gecikme
                      mx: 0.5,
                    }}
                  />
                  <Box
                    component="span"
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.text.secondary,
                      display: 'inline-block',
                      animation: `${wave} 1.3s ease-in-out infinite`,
                      animationDelay: '0.4s', // Üçüncü nokta için gecikme
                      mx: 0.5,
                    }}
                  />
                </Box>
              ) : msg.role === 'assistant' && msg.status !== 'error' ? (
                (() => {
                  const content = msg.content;
                  const codeBlockStartIndex = content.indexOf('```');

                  if (codeBlockStartIndex !== -1) {
                    const beforeCode = content.substring(0, codeBlockStartIndex).trim();
                    const codeBlockMatch = content
                      .substring(codeBlockStartIndex)
                      .match(/^```(\w*)\n([\s\S]*?)\n```$/m);

                    let language = 'plaintext';
                    let codeContent = '';

                    if (codeBlockMatch && codeBlockMatch[2]) {
                      language = codeBlockMatch[1] || 'plaintext';
                      codeContent = codeBlockMatch[2].trim();
                    } else {
                      const lines = content.substring(codeBlockStartIndex).split('\n');
                      if (lines.length > 1) {
                        language = lines[0].substring(3).trim() || 'plaintext';
                        codeContent = lines
                          .slice(1)
                          .join('\n')
                          .replace(/\n```$/, '')
                          .trim();
                      }
                    }

                    return (
                      <>
                        {beforeCode && (
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '0.875rem',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              mb: 1.5,
                            }}
                          >
                            {beforeCode}
                          </Typography>
                        )}
                        {codeContent && (
                          <Box
                            sx={{
                              borderRadius: 1,
                              border: `1px solid ${theme.palette.divider}`,
                              backgroundColor: theme.palette.background.default,
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                px: 1.5,
                                py: 0.5,
                                fontSize: 10,
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                backgroundColor: theme.palette.action.focus,
                                borderTopLeftRadius: 'inherit',
                                borderTopRightRadius: 'inherit',
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 'medium', color: 'text.secondary' }}
                              >
                                {language.toUpperCase()}
                              </Typography>
                              <Stack direction="row" spacing={0.5}>
                                <IconButton
                                  size="small"
                                  title="Copy code"
                                  onClick={() => {
                                    navigator.clipboard.writeText(codeContent);
                                  }}
                                >
                                  <Iconify icon="mdi:content-copy" width={16} />
                                </IconButton>
                              </Stack>
                            </Box>
                            <Box sx={{ px: 0, py: 0, height: 'auto' }}>
                              <Editor
                                language={language.toLowerCase()}
                                value={codeContent}
                                theme={getEditorTheme(theme.palette.mode)}
                                beforeMount={handleMonacoEditorBeforeMount}
                                onMount={handleMonacoEditorDidMount}
                                options={{
                                  automaticLayout: true,
                                  minimap: { enabled: false },
                                  scrollBeyondLastLine: false,
                                  fontSize: 10,
                                  glyphMargin: false,
                                  folding: false,
                                  renderLineHighlight: 'none',
                                  contextmenu: false,
                                  readOnly: true,
                                  domReadOnly: true,
                                  padding: { top: 10, bottom: 10 },
                                  lineNumbers: 'off',
                                  scrollbar: {
                                    vertical: 'hidden',
                                    horizontal: 'hidden',
                                    handleMouseWheel: false,
                                  },
                                  wordWrap: 'on',
                                  occurrencesHighlight: 'off',
                                }}
                              />
                            </Box>
                          </Box>
                        )}
                      </>
                    );
                  }

                  return (
                    <Typography
                      variant="body2"
                      sx={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                    >
                      {content}
                    </Typography>
                  );
                })()
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    color: msg.status === 'error' ? theme.palette.error.main : undefined,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.content}
                </Typography>
              )}
            </Box>
          </Paper>
        ))}
        <div ref={messagesEndRef} />
        {isLoading && chatMessages.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>

      {/* Hata Alanı */}
      {error &&
        !isLoading && ( // Yükleme yokken ve hata varsa göster
          <Alert severity="error" sx={{ mx: 2, mb: 1, fontSize: '0.8rem' }}>
            {error}
          </Alert>
        )}

      {/* Giriş Alanı */}
      <Box
        sx={{
          px: 2,
          pt: 1.5,
          pb: 1.5, // Padding ayarlandı
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          bgcolor: theme.palette.background.neutral, // Arkaplan rengi
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
          <ExpandingActionsButton
            onAttachFile={() => toast.info('The file attachment feature will be available soon.')}
            onStartVoiceInput={() => toast.info('The voice chat feature will be available soon.')}
          />
          <TextField
            fullWidth
            multiline
            maxRows={4} // Maksimum satır sayısı
            variant="outlined"
            size="small" // Boyut küçültüldü
            placeholder={isLoading ? 'AI is thinking...' : 'Ask AI...'}
            value={inputText}
            onChange={handleInputChange}
            disabled={isLoading || chatMode === 'assistant'} // Yüklenirken veya Assistant modunda (ileride) disable
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!isLoading && inputText.trim()) {
                  handleSend();
                }
              }
            }}
            sx={{
              mr: 1,
              ml: 1,
              flexGrow: 1,
              '& .MuiOutlinedInput-root': {
                fontSize: '0.875rem',
              },
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={isLoading || !inputText.trim() || chatMode === 'assistant'}
          >
            <Iconify icon="mdi:send" />
          </IconButton>
        </Box>

        <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
          <ToggleButtonGroup
            color="primary"
            value={chatMode}
            exclusive
            onChange={handleModeChange}
            aria-label="Chat mode"
            size="small"
            sx={{
              bgcolor: theme.palette.background.paper,
              '& .MuiToggleButton-root': {
                fontSize: '0.50rem', // Buton yazı boyutu
                py: 0.5,
                px: 1,
              },
            }}
          >
            <ToggleButton value="support">Support</ToggleButton>
            {/* Assistant modu ileride aktif edilecek */}
            <ToggleButton value="assistant" disabled>
              Assistant
            </ToggleButton>
          </ToggleButtonGroup>

          <FormControl variant="standard" size="small" sx={{ minWidth: 150, alignItems: 'center' }}>
            <Select
              labelId="llm-select-bottom-label"
              value={selectedLlm}
              onChange={handleLlmChange}
              disableUnderline
              sx={{
                fontSize: '1rem',
                '& .MuiSelect-select': {
                  py: 0.5,
                  px: 1,
                  color: 'text.secondary',
                  fontSize: '0.8rem', // LLM seçici yazı boyutu
                  textAlign: 'right',
                  marginRight: '0.5rem',
                  display: 'flex', // İkonu yanına almak için
                  alignItems: 'center', // İkonu yanına almak için
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '1rem',
                },
              }}
            >
              {/* GPT Modelleri */}
              <MenuItem
                value="gpt-4o"
                sx={{
                  fontSize: '0.8rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                GPT-4o
                <Tooltip title={llmDescriptions['gpt-4o']} placement="top-start">
                  <InfoOutlinedIcon sx={{ fontSize: '1rem', ml: 0.5, color: 'text.disabled' }} />
                </Tooltip>
              </MenuItem>
              <MenuItem
                value="gpt-3.5-turbo"
                sx={{
                  fontSize: '0.8rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                GPT-3.5 Turbo
                <Tooltip title={llmDescriptions['gpt-3.5-turbo']} placement="top-start">
                  <InfoOutlinedIcon sx={{ fontSize: '1rem', ml: 0.5, color: 'text.disabled' }} />
                </Tooltip>
              </MenuItem>

              {/* Sensay Modelleri */}
              {SENSAY_DYNAMIC_MODEL_ID && (
                <MenuItem
                  value={SENSAY_DYNAMIC_MODEL_ID}
                  sx={{
                    fontSize: '0.8rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  Sensay (General)
                  <Tooltip
                    title="Sensay: Fine-tuned with Claude 3.7 Sonnet for general contract/program development support. (Free until May 30, 2025)"
                    placement="top-start"
                  >
                    <InfoOutlinedIcon sx={{ fontSize: '1rem', ml: 0.5, color: 'text.disabled' }} />
                  </Tooltip>
                </MenuItem>
              )}
              {SENSAY_AUDITOR_MODEL_ID && (
                <MenuItem
                  value={SENSAY_AUDITOR_MODEL_ID}
                  sx={{
                    fontSize: '0.8rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  Sensay (Auditor)
                  <Tooltip
                    title="Sensay: Fine-tuned AI specialized for smart contract/program auditing. (Free until May 30, 2025)"
                    placement="top-start"
                  >
                    <InfoOutlinedIcon sx={{ fontSize: '1rem', ml: 0.5, color: 'text.disabled' }} />
                  </Tooltip>
                </MenuItem>
              )}

              {/* Claude Modelleri */}
              <MenuItem
                value="claude-3.5-sonnet"
                sx={{
                  fontSize: '0.8rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                disabled
              >
                Claude 3.5 Sonnet
                <Tooltip title={llmDescriptions['claude-3.5-sonnet']} placement="top-start">
                  <InfoOutlinedIcon sx={{ fontSize: '1rem', ml: 0.5, color: 'text.disabled' }} />
                </Tooltip>
              </MenuItem>
              <MenuItem
                value="claude-3.7-sonnet"
                sx={{
                  fontSize: '0.8rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                disabled
              >
                Claude 3.7 Sonnet
                <Tooltip title={llmDescriptions['claude-3.7-sonnet']} placement="top-start">
                  <InfoOutlinedIcon sx={{ fontSize: '1rem', ml: 0.5, color: 'text.disabled' }} />
                </Tooltip>
              </MenuItem>

              {/* Gemini Modelleri */}
              <MenuItem
                value="gemini-2.5-pro"
                sx={{
                  fontSize: '0.8rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                disabled
              >
                Gemini 2.5 Pro
                <Tooltip title={llmDescriptions['gemini-2.5-pro']} placement="top-start">
                  <InfoOutlinedIcon sx={{ fontSize: '1rem', ml: 0.5, color: 'text.disabled' }} />
                </Tooltip>
              </MenuItem>
              <MenuItem
                value="gemini-2.5-flash"
                sx={{
                  fontSize: '0.8rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                disabled
              >
                Gemini 2.5 Flash
                <Tooltip title={llmDescriptions['gemini-2.5-flash']} placement="top-start">
                  <InfoOutlinedIcon sx={{ fontSize: '1rem', ml: 0.5, color: 'text.disabled' }} />
                </Tooltip>
              </MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>
    </Box>
  );
}
