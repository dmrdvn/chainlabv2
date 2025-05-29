import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import Zoom from '@mui/material/Zoom';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import { useTheme, alpha } from '@mui/material/styles';
import { Iconify } from 'src/components/iconify';
import { toast } from 'sonner';
import { Scrollbar } from 'src/components/scrollbar';

const AVAILABLE_SENSAY_BASE_MODELS = [
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    icon: 'simple-icons:openai',
    color: '#10A37F',
    description: 'Most capable OpenAI model',
  },
  {
    id: 'gpt-4o-mini',
    name: 'OpenAI GPT-4o Mini',
    icon: 'simple-icons:openai',
    color: '#10A37F',
    description: 'Faster & more efficient',
  },
  {
    id: 'claude-3-5-sonnet-20240620',
    name: 'Anthropic Claude 3.5 Sonnet',
    icon: 'simple-icons:anthropic',
    color: '#D97706',
    description: 'Advanced reasoning & analysis',
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Anthropic Claude 3 Opus',
    icon: 'simple-icons:anthropic',
    color: '#D97706',
    description: 'Most powerful Claude model',
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Anthropic Claude 3 Haiku',
    icon: 'simple-icons:anthropic',
    color: '#D97706',
    description: 'Fast & lightweight',
  },
];

interface ReplicaData {
  id: string; // Sensay UUID
  name: string;
  model: string; // base model id
  systemPrompt?: string;
  greeting?: string;
  createdAt: string; // ISO string
  shortDescription: string;
}

const LOCAL_STORAGE_KEY = 'chainlab_user_llm_replicas';

export default function LlmSettingsPanel() {
  const theme = useTheme();
  const [replicaName, setReplicaName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [selectedBaseModel, setSelectedBaseModel] = useState<string>(
    AVAILABLE_SENSAY_BASE_MODELS[0].id
  );
  const [systemPrompt, setSystemPrompt] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('');
  const [userReplicas, setUserReplicas] = useState<ReplicaData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedReplicas = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedReplicas) {
        const parsedReplicas: ReplicaData[] = JSON.parse(storedReplicas);
        if (Array.isArray(parsedReplicas)) {
          setUserReplicas(parsedReplicas);
        } else {
          setUserReplicas([]);
        }
      }
    } catch (error) {
      console.error('Error loading replicas from localStorage:', error);
      toast.error('Could not load your saved LLM replicas.');
      setUserReplicas([]);
    }
  }, []);

  const saveReplicasToLocalStorage = (replicas: ReplicaData[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(replicas));
      window.dispatchEvent(new CustomEvent('replicasUpdated'));
    } catch (error) {
      console.error('Error saving replicas to localStorage:', error);
      toast.error('Could not save your LLM replicas.');
    }
  };

  const handleCreateModel = useCallback(async () => {
    if (!replicaName.trim() || !selectedBaseModel || !shortDescription.trim()) {
      toast.error('Replica name, short description, and base model are required.');
      return;
    }
    setIsLoading(true);

    const newReplicaPayload = {
      name: replicaName,
      short_description: shortDescription,
      model: selectedBaseModel,
      system_prompt: systemPrompt || undefined,
      greeting: greetingMessage || undefined,
    };

    try {
      const response = await fetch('/api/ai/create-sensay-replica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReplicaPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error creating replica: ${response.statusText}`);
      }

      const createdReplicaData = await response.json();

      const newCompleteReplica: ReplicaData = {
        id: createdReplicaData.id,
        name: createdReplicaData.name,
        model: createdReplicaData.model,
        systemPrompt: createdReplicaData.systemPrompt,
        greeting: createdReplicaData.greeting,
        createdAt: createdReplicaData.createdAt || new Date().toISOString(),
        shortDescription: createdReplicaData.shortDescription,
      };

      const updatedReplicas = [...userReplicas, newCompleteReplica];
      setUserReplicas(updatedReplicas);
      saveReplicasToLocalStorage(updatedReplicas);

      toast.success(`Replica "${replicaName}" created successfully!`);
      setReplicaName('');
      setShortDescription('');
      setSystemPrompt('');
      setGreetingMessage('');
    } catch (error: any) {
      console.error('Failed to create replica:', error);
      toast.error(`Failed to create replica: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [
    replicaName,
    selectedBaseModel,
    systemPrompt,
    greetingMessage,
    shortDescription,
    userReplicas,
    saveReplicasToLocalStorage,
  ]);

  const handleDeleteReplica = useCallback(
    async (replicaIdToDelete: string) => {
      const replicaToDelete = userReplicas.find((r) => r.id === replicaIdToDelete);
      if (!replicaToDelete) return;

      const confirmed = window.confirm(
        `Are you sure you want to delete the replica "${replicaToDelete.name}"? This will remove it from Sensay and your local list.`
      );
      if (!confirmed) {
        return;
      }

      setIsDeleting(replicaIdToDelete);
      try {
        const response = await fetch(`/api/ai/delete-sensay-replica/${replicaIdToDelete}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: 'Failed to parse error response from server.' }));
          throw new Error(
            errorData.message || `Error deleting replica from Sensay: ${response.statusText}`
          );
        }

        const updatedReplicas = userReplicas.filter((r) => r.id !== replicaIdToDelete);
        setUserReplicas(updatedReplicas);
        saveReplicasToLocalStorage(updatedReplicas);
        toast.success(`Replica "${replicaToDelete.name}" deleted successfully.`);
      } catch (error: any) {
        console.error('Failed to delete replica:', error);
        toast.error(`Failed to delete replica: ${error.message}`);
      } finally {
        setIsDeleting(null);
      }
    },
    [userReplicas, saveReplicasToLocalStorage]
  );

  const handleEditReplica = () => {
    toast.info('Editing replica feature will be available soon!');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Modern Header with Gradient */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          py: 2,
          px: { xs: 2, md: 4 },
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          backdropFilter: 'blur(10px)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(139, 69, 255, 0.05) 0%, rgba(59, 130, 246, 0.03) 100%)'
                : 'linear-gradient(135deg, rgba(139, 69, 255, 0.03) 0%, rgba(59, 130, 246, 0.02) 100%)',
            zIndex: -1,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              width: 42,
              height: 42,
              boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <Iconify icon="mdi:robot-outline" width={24} />
          </Avatar>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: -0.5,
                mb: 0.2,
                fontSize: '1.3rem',
              }}
            >
              AI Replica Studio
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: '0.85rem',
              }}
            >
              Create & manage your custom AI assistants powered by Sensay
            </Typography>
          </Box>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={userReplicas.length} color="primary" max={99}>
            <Chip
              icon={<Iconify icon="mdi:database-outline" />}
              label="Active Replicas"
              variant="outlined"
              sx={{
                borderColor: alpha(theme.palette.primary.main, 0.3),
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                fontWeight: 600,
              }}
            />
          </Badge>
        </Box>
      </Box>

      <Scrollbar sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            maxWidth: '1400px',
            margin: '0 auto',
            p: { xs: 2, md: 4 },
            background:
              theme.palette.mode === 'dark'
                ? `radial-gradient(ellipse at top, ${alpha('#8B5CF6', 0.1)} 0%, transparent 50%)`
                : `radial-gradient(ellipse at top, ${alpha('#8B5CF6', 0.02)} 0%, transparent 50%)`,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: 4,
              alignItems: 'stretch',
            }}
          >
            {/* Enhanced Create Form */}
            <Box sx={{ flex: { xs: '1', lg: '0 0 450px' } }}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  height: 'fit-content',
                  maxHeight: '85vh',
                  background:
                    theme.palette.mode === 'dark'
                      ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`
                      : `linear-gradient(145deg, ${theme.palette.common.white} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  borderRadius: 3,
                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? '0 20px 40px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.2)'
                      : '0 20px 40px rgba(139, 92, 246, 0.15), 0 8px 16px rgba(139, 92, 246, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'sticky',
                  top: 20,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow:
                      theme.palette.mode === 'dark'
                        ? '0 32px 64px rgba(0,0,0,0.4), 0 16px 32px rgba(0,0,0,0.3)'
                        : '0 32px 64px rgba(139, 92, 246, 0.2), 0 16px 32px rgba(139, 92, 246, 0.15)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'success.main',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      width: 40,
                      height: 40,
                      boxShadow: `0 8px 24px ${alpha('#10B981', 0.3)}`,
                    }}
                  >
                    <Iconify icon="mdi:plus-circle" width={24} />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: 'text.primary',
                        letterSpacing: -0.3,
                      }}
                    >
                      Create New Replica
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 500,
                      }}
                    >
                      Design your perfect AI assistant
                    </Typography>
                  </Box>
                </Box>

                <Stack spacing={3}>
                  <TextField
                    label="Replica Name"
                    value={replicaName}
                    onChange={(e) => setReplicaName(e.target.value)}
                    fullWidth
                    disabled={isLoading || !!isDeleting}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                        },
                        '&.Mui-focused': {
                          transform: 'translateY(-1px)',
                          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`,
                        },
                      },
                    }}
                    placeholder="e.g., Smart Contract Assistant"
                    InputProps={{
                      startAdornment: (
                        <Iconify icon="mdi:robot-outline" sx={{ color: 'text.secondary', mr: 1 }} />
                      ),
                    }}
                  />

                  <TextField
                    label="Short Description"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    fullWidth
                    disabled={isLoading || !!isDeleting}
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                        },
                      },
                    }}
                    placeholder="e.g., Expert in Solidity development and blockchain"
                    helperText="A brief description for your replica (required by Sensay)"
                    InputProps={{
                      startAdornment: (
                        <Iconify icon="mdi:text-short" sx={{ color: 'text.secondary', mr: 1 }} />
                      ),
                    }}
                  />

                  <FormControl
                    fullWidth
                    disabled={isLoading || !!isDeleting}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                        },
                      },
                    }}
                  >
                    <InputLabel id="base-model-select-label">Base Model</InputLabel>
                    <Select
                      labelId="base-model-select-label"
                      value={selectedBaseModel}
                      label="Base Model"
                      onChange={(e: SelectChangeEvent<string>) =>
                        setSelectedBaseModel(e.target.value)
                      }
                      startAdornment={
                        <Iconify icon="mdi:brain" sx={{ color: 'text.secondary', mr: 1 }} />
                      }
                    >
                      {AVAILABLE_SENSAY_BASE_MODELS.map((model) => (
                        <MenuItem key={model.id} value={model.id}>
                          <Box
                            sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}
                          >
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: alpha(model.color, 0.1),
                                color: model.color,
                              }}
                            >
                              <Iconify icon={model.icon} width={18} />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {model.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {model.description}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="System Prompt"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    fullWidth
                    multiline
                    rows={4}
                    disabled={isLoading || !!isDeleting}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                        },
                      },
                    }}
                    placeholder="You are a helpful assistant specialized in Solidity smart contracts and Web3 development. Provide clear, accurate, and actionable advice."
                    InputProps={{
                      startAdornment: (
                        <Iconify
                          icon="mdi:code-braces"
                          sx={{ color: 'text.secondary', mr: 1, alignSelf: 'flex-start', mt: 1 }}
                        />
                      ),
                    }}
                  />

                  <TextField
                    label="Greeting Message"
                    value={greetingMessage}
                    onChange={(e) => setGreetingMessage(e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    disabled={isLoading || !!isDeleting}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                        },
                      },
                    }}
                    placeholder="Hello! I'm your Web3 development assistant. How can I help you build amazing smart contracts today?"
                    InputProps={{
                      startAdornment: (
                        <Iconify
                          icon="mdi:message-text"
                          sx={{ color: 'text.secondary', mr: 1, alignSelf: 'flex-start', mt: 1 }}
                        />
                      ),
                    }}
                  />

                  <Button
                    variant="contained"
                    size="large"
                    color="primary"
                    onClick={handleCreateModel}
                    disabled={
                      isLoading || !!isDeleting || !replicaName.trim() || !shortDescription.trim()
                    }
                    startIcon={
                      isLoading ? (
                        <Iconify icon="eos-icons:loading" />
                      ) : (
                        <Iconify icon="mdi:rocket-launch" />
                      )
                    }
                    sx={{
                      py: 1.5,
                      borderRadius: 2,

                      fontWeight: 700,
                      fontSize: '1rem',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

                      '&:disabled': {
                        background: alpha(theme.palette.action.disabled, 0.1),
                        color: theme.palette.action.disabled,
                      },
                    }}
                  >
                    {isLoading ? 'Creating Magic...' : 'Create Replica'}
                  </Button>
                </Stack>
              </Paper>
            </Box>

            {/* Enhanced Divider */}
            <Box
              sx={{
                display: { xs: 'none', lg: 'flex' },
                justifyContent: 'center',
                alignItems: 'center',
                width: '60px',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  width: 2,
                  height: '60%',
                  background: `linear-gradient(to bottom, transparent, ${alpha(theme.palette.primary.main, 0.3)}, transparent)`,
                  borderRadius: 1,
                }}
              />
              <Avatar
                sx={{
                  position: 'absolute',
                  width: 40,
                  height: 40,
                  bgcolor: 'background.paper',
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <Iconify icon="mdi:arrow-right" sx={{ color: 'primary.main' }} />
              </Avatar>
            </Box>

            {/* Enhanced Replicas List */}
            <Box sx={{ flex: 1 }}>
              {userReplicas.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    background:
                      theme.palette.mode === 'dark'
                        ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.4)} 0%, ${alpha(theme.palette.background.paper, 0.1)} 100%)`
                        : `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.01)} 100%)`,
                    border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 300,
                    height: '100%',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: alpha(theme.palette.primary.main, 0.4),
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': {
                          transform: 'scale(1)',
                          opacity: 1,
                        },
                        '50%': {
                          transform: 'scale(1.05)',
                          opacity: 0.8,
                        },
                        '100%': {
                          transform: 'scale(1)',
                          opacity: 1,
                        },
                      },
                    }}
                  >
                    <Iconify
                      icon="mdi:robot-confused-outline"
                      width={64}
                      sx={{
                        color: theme.palette.primary.main,
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
                      }}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: 'text.primary',
                      mb: 1,
                      letterSpacing: -0.3,
                    }}
                  >
                    No AI Replicas Yet
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.secondary',
                      mb: 2,
                      maxWidth: 300,
                      lineHeight: 1.6,
                    }}
                  >
                    Create your first AI assistant to get started. It's quick and easy!
                  </Typography>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<Iconify icon="mdi:arrow-left" />}
                    sx={{
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      color: 'primary.main',
                      fontWeight: 600,
                      px: 3,
                      py: 1,
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    Use the form to get started
                  </Button>
                </Paper>
              ) : (
                <Stack spacing={3}>
                  {userReplicas.map((replica, index) => (
                    <Fade in={true} timeout={300 + index * 100} key={replica.id}>
                      <Card
                        elevation={0}
                        sx={{
                          background:
                            theme.palette.mode === 'dark'
                              ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`
                              : `linear-gradient(145deg, ${theme.palette.common.white} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                          backdropFilter: 'blur(20px)',
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                          borderRadius: 3,
                          boxShadow:
                            theme.palette.mode === 'dark'
                              ? '0 8px 32px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.1)'
                              : '0 8px 32px rgba(139, 92, 246, 0.08), 0 4px 16px rgba(139, 92, 246, 0.05)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          overflow: 'hidden',
                          position: 'relative',
                          '&:hover': {
                            boxShadow:
                              theme.palette.mode === 'dark'
                                ? '0 16px 48px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)'
                                : '0 16px 48px rgba(139, 92, 246, 0.15), 0 8px 24px rgba(139, 92, 246, 0.1)',
                            '& .action-buttons': {
                              opacity: 1,
                              transform: 'translateX(0)',
                            },
                          },
                        }}
                      >
                        <CardHeader
                          avatar={
                            <Box sx={{ position: 'relative' }}>
                              <Avatar
                                sx={{
                                  width: 56,
                                  height: 56,
                                  background: `linear-gradient(135deg, ${
                                    AVAILABLE_SENSAY_BASE_MODELS.find((m) => m.id === replica.model)
                                      ?.color || '#667eea'
                                  } 0%, ${alpha(
                                    AVAILABLE_SENSAY_BASE_MODELS.find((m) => m.id === replica.model)
                                      ?.color || '#667eea',
                                    0.7
                                  )} 100%)`,
                                  boxShadow: `0 8px 24px ${alpha(
                                    AVAILABLE_SENSAY_BASE_MODELS.find((m) => m.id === replica.model)
                                      ?.color || '#667eea',
                                    0.3
                                  )}`,
                                  border: `2px solid ${alpha(theme.palette.background.paper, 0.8)}`,
                                }}
                              >
                                {isDeleting === replica.id ? (
                                  <Iconify icon="eos-icons:loading" width={28} />
                                ) : (
                                  <Iconify
                                    icon={
                                      AVAILABLE_SENSAY_BASE_MODELS.find(
                                        (m) => m.id === replica.model
                                      )?.icon || 'mdi:robot-outline'
                                    }
                                    width={28}
                                    sx={{ color: 'white' }}
                                  />
                                )}
                              </Avatar>
                              <Box
                                sx={{
                                  position: 'absolute',
                                  bottom: -2,
                                  right: -2,
                                  width: 20,
                                  height: 20,
                                  borderRadius: '50%',
                                  bgcolor: 'success.main',
                                  border: `2px solid ${theme.palette.background.paper}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Iconify icon="mdi:check" width={12} sx={{ color: 'white' }} />
                              </Box>
                            </Box>
                          }
                          title={
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                letterSpacing: -0.3,
                                color: 'text.primary',
                              }}
                            >
                              {replica.name}
                            </Typography>
                          }
                          subheader={
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                              <Chip
                                size="small"
                                label={`ID: ${replica.id.substring(0, 100)}`}
                                sx={{
                                  height: 20,
                                  fontSize: '0.7rem',
                                  bgcolor: alpha(theme.palette.primary.main, 0.5),
                                  color: 'primary.main',
                                  fontFamily: 'monospace',
                                  fontWeight: 600,
                                  opacity: 1,
                                }}
                              />
                              <Chip
                                size="small"
                                icon={<Iconify icon="mdi:calendar-clock" width={12} />}
                                label={new Date(replica.createdAt).toLocaleDateString('tr-TR')}
                                sx={{
                                  height: 20,
                                  fontSize: '0.7rem',
                                  bgcolor: alpha(theme.palette.success.main, 0.5),
                                  color: 'success.main',
                                  fontWeight: 600,
                                  opacity: 1,
                                }}
                              />
                            </Stack>
                          }
                          action={
                            <Stack
                              direction="row"
                              spacing={1}
                              className="action-buttons"
                              sx={{
                                opacity: 0.7,
                                transform: 'translateX(8px)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                            >
                              <Tooltip title="Edit Replica (Coming Soon)" arrow>
                                <IconButton
                                  onClick={handleEditReplica}
                                  disabled={!!isDeleting}
                                  size="small"
                                  sx={{
                                    bgcolor: alpha(theme.palette.info.main, 0.1),
                                    color: 'info.main',
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.info.main, 0.2),
                                      transform: 'scale(1.1)',
                                    },
                                  }}
                                >
                                  <Iconify icon="mdi:pencil-outline" width={18} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Replica" arrow>
                                <IconButton
                                  onClick={() => handleDeleteReplica(replica.id)}
                                  disabled={!!isDeleting}
                                  size="small"
                                  sx={{
                                    bgcolor: alpha(theme.palette.error.main, 0.1),
                                    color: 'error.main',
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.error.main, 0.2),
                                      transform: 'scale(1.1)',
                                    },
                                  }}
                                >
                                  {isDeleting === replica.id ? (
                                    <Iconify icon="eos-icons:loading" width={18} />
                                  ) : (
                                    <Iconify icon="mdi:delete-outline" width={18} />
                                  )}
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          }
                          sx={{ pb: 1 }}
                        />

                        <CardContent sx={{ pt: 0 }}>
                          <Typography
                            variant="body1"
                            sx={{
                              color: 'text.secondary',
                              mb: 2,
                              lineHeight: 1.6,
                              fontWeight: 500,
                            }}
                          >
                            {replica.shortDescription}
                          </Typography>

                          <Box sx={{ mb: 2 }}>
                            <Chip
                              avatar={
                                <Avatar
                                  sx={{
                                    bgcolor: alpha(
                                      AVAILABLE_SENSAY_BASE_MODELS.find(
                                        (m) => m.id === replica.model
                                      )?.color || '#667eea',
                                      0.2
                                    ),
                                    width: 24,
                                    height: 24,
                                  }}
                                >
                                  <Iconify
                                    icon={
                                      AVAILABLE_SENSAY_BASE_MODELS.find(
                                        (m) => m.id === replica.model
                                      )?.icon || 'mdi:brain'
                                    }
                                    width={12}
                                    sx={{
                                      color: AVAILABLE_SENSAY_BASE_MODELS.find(
                                        (m) => m.id === replica.model
                                      )?.color,
                                    }}
                                  />
                                </Avatar>
                              }
                              label={
                                AVAILABLE_SENSAY_BASE_MODELS.find((m) => m.id === replica.model)
                                  ?.name || replica.model
                              }
                              variant="outlined"
                              sx={{
                                borderColor: alpha(
                                  AVAILABLE_SENSAY_BASE_MODELS.find((m) => m.id === replica.model)
                                    ?.color || '#667eea',
                                  0.3
                                ),
                                bgcolor: alpha(
                                  AVAILABLE_SENSAY_BASE_MODELS.find((m) => m.id === replica.model)
                                    ?.color || '#667eea',
                                  0.05
                                ),
                                fontWeight: 600,
                                fontSize: '0.8rem',
                              }}
                            />
                          </Box>

                          {replica.greeting && (
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.info.main, 0.05),
                                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                                mb: 1.5,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'info.main',
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                  mb: 0.5,
                                }}
                              >
                                <Iconify
                                  icon="mdi:message-text"
                                  sx={{ mr: 0.5, fontSize: '14px' }}
                                />
                                Greeting Message
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontStyle: 'italic',
                                  color: 'text.secondary',
                                  lineHeight: 1.5,
                                }}
                              >
                                "{replica.greeting}"
                              </Typography>
                            </Box>
                          )}

                          {replica.systemPrompt && (
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.warning.main, 0.05),
                                border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                                maxWidth: '100%',
                                overflow: 'hidden',
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'warning.main',
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                  mb: 0.5,
                                }}
                              >
                                <Iconify
                                  icon="mdi:code-braces"
                                  sx={{ mr: 0.5, fontSize: '14px' }}
                                />
                                System Prompt
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontStyle: 'italic',
                                  color: 'text.secondary',
                                  lineHeight: 1.5,
                                  maxHeight: 120,
                                  overflowY: 'auto',
                                  fontFamily: 'monospace',
                                  fontSize: '0.8rem',
                                  wordBreak: 'break-word',
                                  whiteSpace: 'pre-wrap',
                                  maxWidth: '100%',
                                }}
                                title={replica.systemPrompt}
                              >
                                "{replica.systemPrompt}"
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Fade>
                  ))}
                </Stack>
              )}
            </Box>
          </Box>
        </Box>
      </Scrollbar>
    </Box>
  );
}
