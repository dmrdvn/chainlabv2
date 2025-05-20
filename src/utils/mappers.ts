import type { NotificationItemProps } from 'src/layouts/components/notifications-drawer/notification-item';
/* import type { ContractAbi, ExternalLibrary } from 'src/types/contract'; */
/**
 * RPC dönüş tiplerini haritalamak için yardımcı fonksiyonlar
 */
import type {
  ProjectMember,
  ProjectMemberRpc,
  InvitationStatus,
  ProjectInvitationRpc,
} from 'src/types/member';

/**
 * RPC yanıtından ProjectMember objesine dönüştürür
 * @param rpcMember RPC'den gelen üye verisi
 * @returns Formatlanmış ProjectMember objesi
 */
export function mapRpcMemberToProjectMember(rpcMember: ProjectMemberRpc): ProjectMember {
  return {
    id: rpcMember.id,
    user_id: rpcMember.user_id,
    project_id: rpcMember.project_id,
    all_permissions: rpcMember.custom_flags,
    custom_flags: rpcMember.custom_flags,
    invited_by: rpcMember.invited_by,
    invitation_status: rpcMember.invitation_status as InvitationStatus,
    joined_at: rpcMember.joined_at,
    left_at: rpcMember.left_at,
    user: {
      id: rpcMember.user_id,
      email: rpcMember.user_email,
      fullname: rpcMember.user_fullname,
      avatar_url: rpcMember.user_avatar_url,
    },
    inviter: rpcMember.invited_by
      ? {
          id: rpcMember.invited_by,
          email: rpcMember.inviter_email,
          fullname: rpcMember.inviter_fullname,
          avatar_url: rpcMember.inviter_avatar_url,
        }
      : undefined,
  };
}

/**
 * RPC yanıtından genel bir bildirim objesine dönüştürür
 * @param invite RPC'den gelen davet verisi
 * @returns Formatlanmış bildirim objesi (NotificationItemProps['notification'] tipinde)
 */
export function mapRpcInvitationToInvitation(
  invite: ProjectInvitationRpc
): NotificationItemProps['notification'] {
  return {
    id: invite.id, // Davetin unique ID'si
    type: 'project_invitation', // Bildirim tipi

    title: `You have been invited by ${invite.inviter_fullname} to join the project **${invite.project_name}**`,
    category: 'Invitations', // Bildirim kategorisi
    createdAt: new Date(), // Bildirim oluşturulma zamanı (gerçek zamanlı alınamıyorsa şimdilik new Date())
    isUnread: true, // Başlangıçta okunmamış
    // Avatar için davet edenin avatarını değil, projenin logosunu kullanalım
    avatarUrl: invite.project_logo_url,
    // Ekstra veri olarak proje ve davet eden bilgilerini saklayabiliriz
    // Bu yapı `notification-item.tsx`'in beklemesine göre değişebilir.
    // Şimdilik title içine gömüyoruz, ama gerekirse ayrı alanlar eklenebilir.
    payload: {
      project_id: invite.project_id,

      project_name: invite.project_name,

      project_description: invite.project_description,

      project_logo_url: invite.project_logo_url,

      inviter_fullname: invite.inviter_fullname,

      inviter_email: invite.inviter_email,

      inviter_avatar_url: invite.inviter_avatar_url,

      inviter_id: invite.invited_by,

      member_id: invite.id, // Member (davet) ID'si kabul/red için lazım
    },
  };
}

/**
 * JSON stringini ContractAbi dizisine parse eder
 * @param abiString JSON formatında ABI string
 * @returns ContractAbi dizisi veya null
 */
/* export function parseContractAbi(abiString: string | null): ContractAbi[] | null {
  if (!abiString) return null;

  try {
    return JSON.parse(abiString) as ContractAbi[];
  } catch (error) {
    console.error('ABI parsing error:', error);
    return null;
  }
} */

/**
 * JSON stringini ExternalLibrary dizisine parse eder
 * @param librariesString JSON formatında libraries string
 * @returns ExternalLibrary dizisi veya boş dizi
 */
/* export function parseExternalLibraries(librariesString: string | null): ExternalLibrary[] {
  if (!librariesString) return [];

  try {
    return JSON.parse(librariesString) as ExternalLibrary[];
  } catch (error) {
    console.error('External libraries parsing error:', error);
    return [];
  }
} */
