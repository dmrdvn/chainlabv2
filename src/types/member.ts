import { User } from "./project";

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  flags: string[];
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  invitation_status: InvitationStatus;
  joined_at: string | null;
  left_at: string | null;
  invited_by: string | null;
  custom_flags: string[];
  email?: string; // Davet edilen e-posta (henüz kullanıcı hesabı yoksa)
  isPendingEmailInvitation?: boolean; // E-posta daveti olup olmadığını belirtir
  invitation_token?: string; // E-posta davetleri için token

  // İlişkili tablolar - Supabase'den gelen veriler
  user: User; // User[] yerine tek bir user (tutarlılık)
  inviter?: User; // Optional referans
  permissions?: Permission[];
  all_permissions?: string[]; // Materialized view'dan gelen birleştirilmiş izinler
}

export interface ProjectInvitationRpc {
  id: string;
  project_id: string;
  invitation_status: string;
  invited_by: string;
  project_name: string;
  project_description: string;
  project_logo_url: string;
  inviter_fullname: string;
  inviter_email: string;
  inviter_avatar_url: string;
}

export interface ProjectMemberRpc {
  id: string;
  user_id: string;
  project_id: string;
  custom_flags: string[];
  invited_by: string;
  invitation_status: string;
  joined_at: string | null;
  left_at: string | null;
  user_email: string | null;
  user_fullname: string | null;
  user_avatar_url: string | null;
  inviter_email: string | null;
  inviter_fullname: string | null;
  inviter_avatar_url: string | null;
}

export type Collaborator = {
   id: string;
};

export interface ProjectCollaborator {
          id: string; // Member ID (for members) or Invitation ID (for pending invites)
          project_id: string;
          user_id: string | null; // Null for pending email invites
          email: string | null; // User email or invited email
          display_name: string | null; // User full name/email or invited email
          avatar_url: string | null; // User avatar or null
          invitation_status: 'pending' | 'accepted' | 'rejected' | 'pending_email'; // Status from project_members or custom 'pending_email'
          custom_flags: string[]; // Should match JSONB structure, assuming string array for now
          invited_by: string | null; // UUID of the inviter
          joined_at: string | null; // Null for pending invites and potentially for pending members
          created_at: string | null; // Invitation creation timestamp (for pending_email_invite), null for members
          collaborator_type: 'member' | 'pending_email_invite'; // Discriminator field
          all_permissions?: string[];
        }