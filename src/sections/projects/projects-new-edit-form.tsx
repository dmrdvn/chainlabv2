import type {
  Project,
  ProjectVisibility,
  ProjectSocialLinks,
  ProjectUpdatePayload,
} from 'src/types/project';

import { z as zod } from 'zod';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { useRouter } from 'src/routes/hooks';

import { useProjectFilterOptions } from 'src/hooks/projects';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

// Form değerlerini Project tipine dönüştürmek için yardımcı fonksiyon
function formToProjectData(
  formData: ProjectFormSchemaType & { created_at?: string; updated_at?: string }
): Partial<Project> {
  return {
    ...formData,
    // description ve logo_url null olabilmeli
    description: formData.description || null,
    logo_url: formData.logo_url || null,
    visibility: formData.visibility as ProjectVisibility,
    social_links: formData.social_links,
    platform: formData.platform,
  };
}

// ----------------------------------------------------------------------

// Proje form şeması
export const ProjectFormSchema = zod.object({
  name: zod.string().min(1, { message: 'Project name is required' }),
  description: zod.string().nullable(),
  visibility: zod.enum(['public', 'private']),
  platform: zod.enum(['evm', 'solana'], {
    errorMap: () => ({ message: 'Platform selection is required' }),
  }),
  tags: zod.string().array().default([]),
  logo_url: zod.string().nullable(),
  social_links: zod
    .object({
      github: zod.string().url({ message: 'Invalid URL' }).or(zod.literal('')).optional(),
      twitter: zod.string().url({ message: 'Invalid URL' }).or(zod.literal('')).optional(),
      linkedin: zod.string().url({ message: 'Invalid URL' }).or(zod.literal('')).optional(),
      discord: zod.string().url({ message: 'Geçersiz URL' }).or(zod.literal('')).optional(),
      website: zod.string().url({ message: 'Geçersiz URL' }).or(zod.literal('')).optional(),
    })
    .default({ github: '', twitter: '', linkedin: '', discord: '', website: '' }),
});

export type ProjectFormSchemaType = zod.infer<typeof ProjectFormSchema>;

// ----------------------------------------------------------------------

type ProjectsProps = {
  currentProject?: Project;
  isEditing?: boolean;
  // Güncelleme için prop'lar
  onUpdateProject?: (data: ProjectUpdatePayload) => void;
  isUpdating?: boolean;
  updateError?: Error | null;
  updateSuccess?: boolean;
  resetUpdateStatus?: () => void;
  // Oluşturma için prop'lar
  onCreateProject?: (data: Partial<Project>) => void;
  isCreating?: boolean;
  createError?: Error | null;
  createSuccess?: boolean;
  resetCreateStatus?: () => void;
};

export function ProjectsNewEditForm({
  currentProject,
  isEditing = false,
  onUpdateProject,
  isUpdating = false,
  updateError,
  updateSuccess = false,
  resetUpdateStatus,
  onCreateProject,
  isCreating = false,
  createError,
  createSuccess = false,
  resetCreateStatus,
}: ProjectsProps) {
  const router = useRouter();

  // Filtre seçeneklerini getir
  const { filterOptions, loading: filterOptionsLoading } = useProjectFilterOptions();

  const defaultValues: ProjectFormSchemaType = {
    name: '',
    description: '',
    visibility: 'public',
    platform: 'evm',
    tags: [],
    logo_url: '',
    social_links: {
      github: '',
      twitter: '',
      linkedin: '',
      discord: '',
      website: '',
    },
  };

  const methods = useForm<ProjectFormSchemaType>({
    mode: 'all',
    resolver: zodResolver(ProjectFormSchema),
    defaultValues,
    values: currentProject
      ? {
          ...currentProject,
          // Ensure social_links matches the form schema's expectation (non-optional object, no nulls)
          social_links: currentProject.social_links
            ? Object.entries(currentProject.social_links).reduce(
                (acc, [key, value]) => {
                  acc[key as keyof ProjectSocialLinks] = value === null ? undefined : value; // Convert null to undefined
                  return acc;
                },
                {} as { [K in keyof ProjectSocialLinks]: string | undefined } // Target type for accumulator
              )
            : defaultValues.social_links,
          // Ensure visibility matches the form schema's expectation ('public' | 'private')
          visibility:
            currentProject.visibility === 'public' || currentProject.visibility === 'private'
              ? currentProject.visibility
              : defaultValues.visibility, // Fallback to default if 'hidden' or unexpected value
          platform: currentProject.platform || defaultValues.platform,
        }
      : defaultValues, // Use defaultValues if no currentProject
  });

  const {
    reset,
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (isEditing && onUpdateProject) {
        // Proje güncelleme
        onUpdateProject({
          name: data.name,
          description: data.description || null,
          visibility: data.visibility as ProjectVisibility,
          tags: data.tags,
          logo_url: data.logo_url || null,
          social_links: data.social_links,
          platform: data.platform,
          updated_at: new Date().toISOString(),
        });
      } else if (!isEditing && onCreateProject) {
        // Yeni proje oluşturma
        onCreateProject(
          formToProjectData({
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        );
      }
    } catch (error) {
      console.error(error);
      toast.error('Bir hata oluştu!');
    }
  });

  // Reset status after update success
  useEffect(() => {
    if (updateSuccess && resetUpdateStatus) {
      // Toast is handled by the hook, just reset the status
      resetUpdateStatus();
    }
  }, [updateSuccess, resetUpdateStatus]);

  // Reset status after create success
  useEffect(() => {
    if (createSuccess && resetCreateStatus) {
      // Toast is handled by the hook, just reset the status
      // Optional actions like reset() or router.push() could go here if needed
      resetCreateStatus();
    }
  }, [createSuccess, resetCreateStatus]);

  const renderDetails = () => (
    <Card>
      <CardHeader title="Project Details" subheader="Name, description, image..." sx={{ mb: 3 }} />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Project Name</Typography>
          <Field.Text name="name" placeholder="E.g., ChainLab Smart Contract Project..." />
        </Stack>

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Description</Typography>
          <Field.Editor name="description" sx={{ maxHeight: 480 }} />
        </Stack>

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Logo URL</Typography>
          <Field.Text name="logo_url" placeholder="https://example.com/logo.jpg" />
        </Stack>
      </Stack>
    </Card>
  );

  const renderProperties = () => (
    <Card>
      <CardHeader
        title="Properties"
        subheader="Project status, visibility, and tags..."
        sx={{ mb: 3 }}
      />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Controller
          name="tags"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Field.Autocomplete
              name="tags"
              multiple
              freeSolo
              loading={filterOptionsLoading}
              label="Tags"
              placeholder="+ Tags"
              options={filterOptions?.tags || []}
              value={field.value}
              onChange={(event, newValue) => {
                field.onChange(newValue);
              }}
              slotProps={{
                textfield: {
                  error: !!error,
                  helperText: error?.message,
                },
              }}
            />
          )}
        />
        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Platform</Typography>
          <Field.Select
            name="platform"
            label="Platform"
            helperText="Choose the blockchain platform"
          >
            <MenuItem value="evm">EVM (Ethereum, Polygon, vb.)</MenuItem>
            <MenuItem value="solana">Solana</MenuItem>
          </Field.Select>
        </Stack>
      </Stack>
    </Card>
  );

  const renderSocialLinks = () => (
    <Card>
      <CardHeader
        title="Social Links"
        subheader="GitHub, Twitter, LinkedIn, Discord, Website..."
        sx={{ mb: 3 }}
      />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle2">GitHub</Typography>
          <Field.Text
            name="social_links.github"
            label="GitHub"
            placeholder="https://github.com/..."
          />
        </Stack>

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Twitter / X</Typography>
          <Field.Text
            name="social_links.twitter"
            label="Twitter / X"
            placeholder="https://twitter.com/..."
          />
        </Stack>

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">LinkedIn</Typography>
          <Field.Text
            name="social_links.linkedin"
            label="LinkedIn"
            placeholder="https://linkedin.com/in/..."
          />
        </Stack>

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Discord</Typography>
          <Field.Text
            name="social_links.discord"
            label="Discord"
            placeholder="https://discord.gg/..."
          />
        </Stack>

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">Website</Typography>
          <Field.Text name="social_links.website" label="Website" placeholder="https://..." />
        </Stack>
      </Stack>
    </Card>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        {renderDetails()}
        {renderProperties()}
        {renderSocialLinks()}
        <Stack alignItems="flex-end" sx={{ mt: 3 }}>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting || isUpdating || isCreating}
          >
            {isEditing ? 'Update' : 'Create'}
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  );
}
