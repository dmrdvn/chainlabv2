'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { inviteProjectMember } from 'src/actions/project';
import { toast } from 'src/components/snackbar';
import type { CustomRole } from './use-role-templates';
import {
  removeProjectMember,
  updateMemberPermissions,
  cancelPendingInvitation,
} from 'src/actions/project';
import { acceptProjectInvitation, rejectProjectInvitation } from 'src/actions/project';

// members.ts dosyasından gerekli fonksiyonu import ediyoruz
import { addProjectMember } from 'src/actions/project/members';

/**
 * Davet hatası arayüzü
 */
export interface InviteError {
  message?: string;
  [key: string]: any;
}

/**
 * Davet yanıtı arayüzü
 */
export interface InviteResponse {
  success: boolean;
  isUserRegistered?: boolean;
  member?: { id: string } | null;
  pendingInvitation?: any;
  error?: InviteError;
}

// Tip tanımlaması ekleyelim
interface InvitationResult {
  success: boolean;
  message?: string;
  error?: {
    message: string;
  };
}

/**
 * Hook to add a member to a project
 * @returns Function to add member and loading/error state
 */
export function useAddProjectMember() {
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddMember = async (projectId: string, userId: string, permissions: string[]) => {
    try {
      setLoading(true);
      setError(null);

      // UserId varken email parametresine boş string geçiyoruz
      const result = await addProjectMember(projectId, userId, '', 'member');
      if (!result.success) {
        throw new Error(result.message || 'Failed to add member');
      }

      // Update SWR cache
      await mutate(`project-members-${projectId}`);

      // Show success notification
      toast.success('Member added successfully!');
      return true;
    } catch (err: any) {
      const errorMessage = err?.message || 'An error occurred while adding the member';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Member addition error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    addMember: handleAddMember,
    loading,
    error,
  };
}

/**
 * Hook to remove a member from a project
 * @returns Function to remove member and loading/error state
 */
export function useRemoveProjectMember() {
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemoveMember = async (projectId: string, userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await removeProjectMember(projectId, userId);
      if (!result.success) {
        throw new Error(result.message || 'Failed to remove member');
      }

      // Update SWR cache
      await mutate(`project-members-${projectId}`);

      // Show success notification
      toast.success('Member removed successfully!');
      return true;
    } catch (err: any) {
      const errorMessage = err?.message || 'An error occurred while removing the member';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Member removal error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    removeMember: handleRemoveMember,
    loading,
    error,
  };
}

/**
 * Hook to update member permissions
 * @returns Function to update permissions and loading/error state
 */
export function useUpdateMemberPermissions() {
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdatePermissions = async (
    projectId: string,
    memberId: string,
    permissions: string[]
  ) => {
    try {
      setLoading(true);
      setError(null);

      const result = await updateMemberPermissions(projectId, memberId, permissions);

      if (!result || !result.success) {
        throw new Error(result?.error || 'Failed to update member permissions');
      }

      // Update SWR cache
      await mutate(`project-members-${projectId}`);

      // Show success notification
      toast.success('Member permissions updated successfully!');
      return true;
    } catch (err: any) {
      const errorMessage = err?.message || 'An error occurred while updating permissions';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Permission update error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    updatePermissions: handleUpdatePermissions,
    loading,
    error,
  };
}

/**
 * Proje üyesi davet etmek için kullanılan hook
 * @param projectId Proje ID'si
 */
export function useMemberInvite(projectId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [inviteResponse, setInviteResponse] = useState<InviteResponse | null>(null);

  /**
   * E-posta ile proje üyesi davet etme fonksiyonu
   * @param email Davet edilecek kullanıcının e-postası
   * @param customRole Rol bilgisi (adı, açıklaması ve izin flag'ları)
   * @param message İsteğe bağlı davet mesajı
   */
  const sendInvite = async (email: string, customRole: CustomRole, message?: string) => {
    setLoading(true);
    setError(null);
    setInviteResponse(null);

    try {
      const result = (await inviteProjectMember(
        projectId,
        email,
        customRole,
        message
      )) as InviteResponse;
      setInviteResponse(result);

      if (!result.success) {
        const errorMessage = result.error?.message || 'Davet gönderilirken bir hata oluştu';
        throw new Error(errorMessage);
      }

      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Davet yanıtını sıfırla
   */
  const resetInviteResponse = () => {
    setInviteResponse(null);
    setError(null);
  };

  return {
    sendInvite,
    resetInviteResponse,
    inviteResponse,
    loading,
    error,
  };
}

/**
 * Proje davetlerini kabul etmek için hook
 * @returns Proje daveti işlemleri için gerekli fonksiyonlar ve durumlar
 */
export function useProjectInvitation() {
  const [processing, setProcessing] = useState(false);
  const [responded, setResponded] = useState(false);
  const [responseType, setResponseType] = useState<'accepted' | 'rejected' | null>(null);

  /**
   * Proje davetini kabul etme işlemi
   * @param memberId Üyelik ID
   */
  const handleAcceptInvitation = async (memberId: string) => {
    console.log('[hook] acceptInvitation başlatıldı, memberId:', memberId);

    if (!memberId) {
      console.error('[hook] HATA: Geçersiz davet ID');
      toast.error('Geçersiz davet ID');
      return false;
    }

    try {
      setProcessing(true);
      console.log('[hook] İşleniyor durumu ayarlandı (true)');

      console.log('[hook] acceptProjectInvitation server action çağrılıyor...');
      const result = (await acceptProjectInvitation(memberId)) as InvitationResult;
      console.log('[hook] acceptProjectInvitation server action sonucu:', result);

      if (result.success) {
        console.log('[hook] İşlem başarılı, toast gösteriliyor');
        toast.success(result.message || 'Davet başarıyla kabul edildi!');
        setResponseType('accepted');
        setResponded(true);
        return true;
      } else {
        console.error('[hook] İşlem başarısız, hata:', result.error);
        toast.error(result.error?.message || 'Davet kabul edilirken bir hata oluştu.');
        return false;
      }
    } catch (error: any) {
      console.error('[hook] acceptInvitation içinde beklenmeyen hata:', error);
      toast.error(error.message || 'Davet kabul edilirken bir hata oluştu.');
      return false;
    } finally {
      console.log('[hook] İşleniyor durumu sıfırlanıyor (false)');
      setProcessing(false);
    }
  };

  /**
   * Proje davetini reddetme işlemi
   * @param memberId Üyelik ID
   */
  const handleRejectInvitation = async (memberId: string) => {
    console.log('[hook] rejectInvitation başlatıldı, memberId:', memberId);

    if (!memberId) {
      console.error('[hook] HATA: Geçersiz davet ID');
      toast.error('Geçersiz davet ID');
      return false;
    }

    try {
      setProcessing(true);
      console.log('[hook] İşleniyor durumu ayarlandı (true)');

      console.log('[hook] rejectProjectInvitation server action çağrılıyor...');
      const result = (await rejectProjectInvitation(memberId)) as InvitationResult;
      console.log('[hook] rejectProjectInvitation server action sonucu:', result);

      if (result.success) {
        console.log('[hook] İşlem başarılı, toast gösteriliyor');
        toast.success(result.message || 'Davet başarıyla reddedildi!');
        setResponseType('rejected');
        setResponded(true);
        return true;
      } else {
        console.error('[hook] İşlem başarısız, hata:', result.error);
        toast.error(result.error?.message || 'Davet reddedilirken bir hata oluştu.');
        return false;
      }
    } catch (error: any) {
      console.error('[hook] rejectInvitation içinde beklenmeyen hata:', error);
      toast.error(error.message || 'Davet reddedilirken bir hata oluştu');
      return false;
    } finally {
      console.log('[hook] İşleniyor durumu sıfırlanıyor (false)');
      setProcessing(false);
    }
  };

  /**
   * Hook durumunu resetleme
   */
  const reset = () => {
    setProcessing(false);
    setResponded(false);
    setResponseType(null);
  };

  return {
    processing,
    responded,
    responseType,
    acceptInvitation: handleAcceptInvitation,
    rejectInvitation: handleRejectInvitation,
    reset,
  };
}

export function useCancelPendingInvitationMutation() {
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancelPendingInvitation = async (projectId: string, invitationId: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await cancelPendingInvitation(projectId, invitationId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel pending invitation');
      }

      // Update SWR cache
      await mutate(`project-members-${projectId}`);

      // Show success notification
      toast.success('Pending invitation cancelled successfully!');
      return true;
    } catch (err: any) {
      const errorMessage =
        err?.message || 'An error occurred while cancelling the pending invitation';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Pending invitation cancellation error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    cancelPendingInvitation: handleCancelPendingInvitation,
    loading,
    error,
  };
}
