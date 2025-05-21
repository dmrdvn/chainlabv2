'use client';

import type { ProjectCollaborator } from 'src/types/member';

import { mapRpcInvitationToInvitation } from 'src/utils/mappers';

import { supabase } from 'src/lib/supabase';

import { sendInvitationEmail } from '../email';

/**
 * Proje sahibi kullanıcı bilgisini getiren fonksiyon
 * @param ownerId Proje sahibi ID
 * @returns Kullanıcı bilgisi veya null
 */
export async function getProjectOwner(ownerId: string) {
  try {
    /*   console.log('=== SERVER ACTION: getProjectOwner başladı ==='); */
    /* console.log('Owner ID:', ownerId); */

    if (!ownerId) {
      console.log('Owner ID boş veya geçersiz, varsayılan kullanıcı bilgisi döndürülüyor');
      return { id: null, email: null, fullname: 'Anonymous', avatar_url: null };
    }

    // RPC fonksiyonunu çağır
    const { data, error: rpcError } = await supabase.rpc('get_project_owner', {
      p_owner_id: ownerId,
    });

    if (rpcError) {
      console.error('RPC çağrısında hata:', rpcError.message);
      console.error('Hata detayı:', rpcError.details);
      return { id: ownerId, email: null, fullname: 'Anonymous', avatar_url: null };
    }

    // Kullanıcı bulunamadıysa, varsayılan döndür
    if (!data || data.length === 0) {
      console.log(`Kullanıcı bulunamadı (ID: ${ownerId}), varsayılan değerler döndürülüyor`);
      return { id: ownerId, email: null, fullname: 'Anonymous', avatar_url: null };
    }

    /* console.log('Proje sahibi bilgisi başarıyla alındı'); */
    /* console.log('=== SERVER ACTION: getProjectOwner başarıyla tamamlandı ==='); */
    return data[0];
  } catch (error) {
    console.error('Proje sahibi bilgisi alınırken beklenmeyen hata:', error);
    console.log('=== SERVER ACTION: getProjectOwner hata ile tamamlandı ===');
    return { id: ownerId, email: null, fullname: 'Anonymous', avatar_url: null };
  }
}

/**
 * Kullanıcının belirli bir projenin sahibi olup olmadığını kontrol eden fonksiyon
 * @param userId Kullanıcı ID
 * @param projectId Proje ID
 * @returns Proje sahibi mi?
 */
export async function isProjectOwner(userId: string, projectId: string): Promise<boolean> {
  try {
    /* console.log('=== SERVER ACTION: isProjectOwner başladı ==='); */
    /* console.log('Kullanıcı ID:', userId); */
    /* console.log('Proje ID:', projectId); */

    // Proje ID'sinin geçerli bir UUID olup olmadığını kontrol et
    // Basit bir regex kontrolü yapabiliriz veya bir UUID validation kütüphanesi kullanılabilir.
    // Şimdilik temel formatı kontrol edelim: 8-4-4-4-12 hexadecimal karakter.
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!projectId || !uuidRegex.test(projectId)) {
      console.warn(`Geçersiz proje ID formatı: "${projectId}". RPC çağrısı yapılmayacak.`);
      console.log('=== SERVER ACTION: isProjectOwner geçersiz ID ile tamamlandı ===');
      return false; // Geçersiz ID ise sahip değildir.
    }

    // RPC fonksiyonunu çağır
    const { data: isOwner, error: rpcError } = await supabase.rpc('is_project_owner', {
      p_user_id: userId,
      p_project_id: projectId,
    });

    if (rpcError) {
      console.error('RPC çağrısında hata:', rpcError.message);
      console.error('Hata detayı:', rpcError.details);
      return false;
    }

    /* console.log('Proje sahipliği kontrolü:', isOwner);
    console.log('=== SERVER ACTION: isProjectOwner başarıyla tamamlandı ==='); */
    return !!isOwner;
  } catch (error) {
    console.error('Proje sahibi kontrolünde beklenmeyen hata:', error);
    console.log('=== SERVER ACTION: isProjectOwner hata ile tamamlandı ===');
    return false;
  }
}

/**
 * Kullanıcının proje davetlerini getiren fonksiyon
 * @returns Bekleyen proje davetleri listesi
 */
export async function getProjectInvitations() {
  try {
    /* console.log('=== SERVER ACTION: getProjectInvitations başladı ==='); */

    // Kullanıcı oturumunu al
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData?.session) {
      console.error('Aktif oturum bulunamadı');
      return [];
    }

    const userId = sessionData.session.user.id;
    console.log('User ID:', userId);

    // RPC fonksiyonunu çağır
    const { data, error: rpcError } = await supabase.rpc('get_user_project_invitations', {
      p_user_id: userId,
    });

    if (rpcError) {
      console.error('RPC çağrısında hata:', rpcError.message);
      console.error('Hata detayı:', rpcError.details);
      return []; // Hata durumunda boş dizi döndür
    }

    if (!data) {
      console.log('Davet bulunamadı');
      return [];
    }

    /* console.log(`${data.length} adet davet bulundu`); */

    // RPC verisini ProjectInvitation tipine map et
    const formattedInvitations = data.map(mapRpcInvitationToInvitation);

    /*  console.log('Davetler başarıyla formatlandı'); */
    /* console.log('=== SERVER ACTION: getProjectInvitations başarıyla tamamlandı ==='); */
    return formattedInvitations; // Formatlanmış veriyi döndür
  } catch (error) {
    console.error('Davetler alınırken beklenmeyen hata:', error);
    /* console.log('=== SERVER ACTION: getProjectInvitations hata ile tamamlandı ==='); */
    return [];
  }
}

/**
 * Proje üyeleri bilgisini getiren fonksiyon
 * @param projectId Proje ID
 * @returns Proje üyeleri ve izinleri
 */
export async function getProjectMembers(projectId: string): Promise<ProjectCollaborator[]> {
  // Dönüş tipini güncelle
  try {
    /* console.log('=== SERVER ACTION: getProjectMembers başladı ==='); */
    /* console.log('Proje ID:', projectId); */

    // RPC fonksiyonunu çağır
    const { data, error: rpcError } = await supabase.rpc('get_project_members', {
      p_project_id: projectId,
    });

    if (rpcError) {
      console.error('RPC çağrısında hata:', rpcError.message);
      console.error('Hata detayı:', rpcError.details);
      return []; // Hata durumunda boş dizi döndür
    }

    if (!data) {
      console.log('Üye veya davet bulunamadı');
      return [];
    }

    /* console.log(`${data.length} işbirlikçi (üye/davet) başarıyla alındı`); */

    // RPC verisini doğrudan ProjectCollaborator dizisi olarak döndür
    // mapRpcMemberToProjectMember çağrısını kaldır
    const collaborators = data as ProjectCollaborator[]; // Direkt type assertion

    /* console.log('=== SERVER ACTION: getProjectMembers başarıyla tamamlandı ==='); */
    return collaborators; // Ham ama tipli veriyi döndür
  } catch (error) {
    console.error('Proje işbirlikçileri alınırken beklenmeyen hata:', error);
    console.log('=== SERVER ACTION: getProjectMembers hata ile tamamlandı ===');
    return [];
  }
}

/**
 * Proje üyesi davet etme fonksiyonu
 * @param projectId Proje ID'si
 * @param email Davet edilecek kullanıcının e-postası
 * @param customRole Özel rol bilgisi (rol adı, açıklaması ve izin flag'ları)
 * @param inviteMessage İsteğe bağlı davet mesajı
 * @returns Sonuç objesini döndürür
 */
export async function inviteProjectMember(
  projectId: string,
  email: string,
  customRole: { name: string; description: string; flags: string[] },
  inviteMessage?: string
) {
  try {
    console.log('=== SERVER ACTION: inviteProjectMember başladı ===');
    console.log('Davet parametreleri:', { projectId, email, customRole, inviteMessage });

    // 1. Kullanıcı oturumunu kontrol et
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    if (!sessionData.session) {
      console.error('Oturum açık değil');
      return { success: false, error: { message: 'Session not found' } };
    }

    const currentUserId = sessionData.session.user.id;
    /* console.log('Davet eden kullanıcı ID:', currentUserId); */

    // 2. Davet edilecek kullanıcının varlığını kontrol et
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      console.error('Kullanıcı sorgulanırken hata:', userError);
      throw userError;
    }

    // Kullanıcının kayıtlı olup olmadığını belirle
    const isUserRegistered = !!existingUser;
    const userId = isUserRegistered ? existingUser.id : null;
    console.log('Kullanıcı kayıtlı mı:', isUserRegistered, 'User ID:', userId);

    // 3. RPC fonksiyonu ile davet gönder
    console.log('RPC fonksiyonu ile davet gönderiliyor...');
    const { data: rpcResult, error: rpcError } = await supabase.rpc('invite_project_member', {
      p_project_id: projectId,
      p_email: email,
      p_user_id: userId,
      p_invited_by: currentUserId,
      p_custom_flags: customRole.flags || [],
      p_invitation_message: inviteMessage || '',
      p_is_email_invitation: !isUserRegistered,
    });

    if (rpcError) {
      console.error('RPC çağrısında hata:', rpcError);
      return {
        success: false,
        error: { message: rpcError.message || 'An error occurred while creating the invitation.' },
      };
    }

    console.log('RPC sonucu:', rpcResult);

    // RPC'den gelen sonucu kontrol et
    if (!rpcResult.success) {
      console.error('RPC başarısız:', rpcResult.message);
      return {
        success: false,
        error: { message: rpcResult.message || 'An error occurred while creating the invitation.' },
      };
    }

    // 4. Davet başarılı, e-posta gönderme işlemi
    let emailError = null;
    try {
      // Proje adını al
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      const projectName = projectData?.name || 'ChainLab Projesi';

      // Davetiyeyi gönderen kullanıcının adını al
      const { data: userData, error: inviterError } = await supabase
        .from('users')
        .select('fullname')
        .eq('id', currentUserId)
        .single();

      if (inviterError) throw inviterError;

      const senderName = userData?.fullname || 'ChainLab Ekibi';

      // E-posta göndermeyi dene, ancak başarısız olursa devam et
      try {
        // E-posta gönder
        if (isUserRegistered) {
          // Kayıtlı kullanıcı için davet e-postası gönder
          await sendInvitationEmail({
            email,
            projectName,
            projectId,
            invitationToken: generateInvitationToken(), // Basit bir token yeterli
            inviteMessage,
            senderName,
            isRegistered: true,
          });
        } else if (rpcResult.invitationToken) {
          // Kayıtsız kullanıcı için davet e-postası gönder
          await sendInvitationEmail({
            email,
            projectName,
            projectId,
            invitationToken: rpcResult.invitationToken,
            inviteMessage,
            senderName,
            isRegistered: false,
          });
        }
      } catch (err) {
        // E-posta gönderim hatasını kaydet ancak işlemi durdurma
        console.error('Davet e-postası gönderilirken hata (ancak işlem devam ediyor):', err);
        emailError = err;
      }
    } catch (err) {
      console.error('Davet bilgileri hazırlanırken hata:', err);
    }

    console.log('=== SERVER ACTION: inviteProjectMember başarıyla tamamlandı ===');

    // Davet başarılı
    return {
      success: true,
      isUserRegistered,
      member: isUserRegistered ? { id: rpcResult.memberId } : null,
      pendingInvitation: !isUserRegistered
        ? {
            id: rpcResult.pendingInvitationId,
            invitation_token: rpcResult.invitationToken,
            expires_at: rpcResult.expiresAt,
          }
        : null,
    };
  } catch (error) {
    console.error('Proje üyesi daveti gönderilirken beklenmeyen hata:', error);
    console.log('=== SERVER ACTION: inviteProjectMember hata ile tamamlandı ===');
    return { success: false, error };
  }
}

// Benzersiz davet tokeni oluşturmak için yardımcı fonksiyon
function generateInvitationToken(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

/**
 * Proje davetini kabul etme
 * @param memberId Proje davetini kabul eden kullanıcının üyelik ID'si
 * @returns Kabul durumu
 */
export async function acceptProjectInvitation(memberId: string) {
  try {
    console.log('=== SERVER ACTION: acceptProjectInvitation başladı ===');
    console.log('Member ID:', memberId);

    // 1. Parametre kontrolü
    if (!memberId) {
      console.error('Geçersiz memberId:', memberId);
      throw new Error('Invalid invitation.');
    }

    // 2. Kullanıcı oturumunu kontrol et
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData?.session?.user?.id) {
      console.error('Oturum açılmamış');
      throw new Error('Session not found.');
    }

    const userId = sessionData.session.user.id;
    /* console.log('Oturum açmış kullanıcı ID:', userId); */

    // 3. RPC fonksiyonu ile daveti kabul et
    console.log('RPC fonksiyonu çağrılıyor...');
    const { data: rpcResult, error: rpcError } = await supabase.rpc('accept_project_invitation', {
      p_member_id: memberId,
    });

    if (rpcError) {
      console.error('RPC çağrısında hata:', rpcError);
      throw new Error('Invitation could not be accepted.');
    }

    console.log('RPC fonksiyonu sonucu:', rpcResult);

    // RPC'den gelen sonucu kontrol et
    if (!rpcResult.success) {
      console.error('RPC başarısız:', rpcResult.message);
      throw new Error(rpcResult.message || 'Invitation could not be accepted.');
    }

    console.log('Davet başarıyla kabul edildi:', memberId);
    console.log('=== SERVER ACTION: acceptProjectInvitation başarıyla tamamlandı ===');
    return { success: true, message: 'Invitation accepted successfully' };
  } catch (error: any) {
    console.error('Davet kabul edilirken beklenmeyen hata:', error);
    console.log('=== SERVER ACTION: acceptProjectInvitation hata ile tamamlandı ===');
    return {
      success: false,
      error: {
        message: error.message || 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Proje davetini reddetme
 * @param memberId Proje davetini reddeden kullanıcının üyelik ID'si
 * @returns Red durumu
 */
export async function rejectProjectInvitation(memberId: string) {
  try {
    console.log('=== SERVER ACTION: rejectProjectInvitation başladı ===');
    console.log('Member ID:', memberId);

    // 1. Parametre kontrolü
    if (!memberId) {
      console.error('Geçersiz memberId:', memberId);
      throw new Error('Invalid invitation.');
    }

    // 2. Kullanıcı oturumunu kontrol et
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData?.session?.user?.id) {
      console.error('Oturum açılmamış');
      throw new Error('Session not found.');
    }

    /* const userId = sessionData.session.user.id; */
    /* console.log('Oturum açmış kullanıcı ID:', userId); */

    // 3. RPC fonksiyonu ile daveti reddet
    console.log('RPC fonksiyonu çağrılıyor...');
    const { data: rpcResult, error: rpcError } = await supabase.rpc('reject_project_invitation', {
      p_member_id: memberId,
    });

    if (rpcError) {
      console.error('RPC çağrısında hata:', rpcError);
      throw new Error('Invitation could not be rejected.');
    }

    console.log('RPC fonksiyonu sonucu:', rpcResult);

    // RPC'den gelen sonucu kontrol et
    if (!rpcResult.success) {
      console.error('RPC başarısız:', rpcResult.message);
      throw new Error(rpcResult.message || 'Invitation could not be rejected.');
    }

    console.log('Davet başarıyla reddedildi:', memberId);
    console.log('=== SERVER ACTION: rejectProjectInvitation başarıyla tamamlandı ===');
    return { success: true, message: 'Invitation rejected successfully' };
  } catch (error: any) {
    console.error('Davet reddedilirken beklenmeyen hata:', error);
    console.log('=== SERVER ACTION: rejectProjectInvitation hata ile tamamlandı ===');
    return {
      success: false,
      error: {
        message: error.message || 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Proje üyesini çıkaran/davetini iptal eden fonksiyon
 * @param projectId Proje ID
 * @param memberId Üye ID
 * @returns İşlem başarılı mı?
 */
export async function removeProjectMember(projectId: string, memberId: string) {
  try {
    console.log('=== SERVER ACTION: removeProjectMember başladı ===');
    console.log('Proje ID:', projectId);
    console.log('Üye ID:', memberId);

    // 1. Kullanıcı oturumunu kontrol et
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData?.session) {
      console.error('Aktif oturum bulunamadı, üye çıkarılamaz');
      return { success: false, error: 'Session not found' };
    }

    const currentUserId = sessionData.session.user.id;

    // 2. Kullanıcının yetkisini kontrol et
    const isOwner = await isProjectOwner(currentUserId, projectId);

    if (!isOwner) {
      // Kullanıcı proje sahibi değilse, admin rolünü kontrol et
      const { data: memberData } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', currentUserId)
        .eq('invitation_status', 'accepted')
        .maybeSingle();

      if (!memberData || memberData.role !== 'admin') {
        console.error('Yetki hatası: Kullanıcı admin veya proje sahibi değil');
        return { success: false, error: 'You do not have permission for this action' };
      }
    }

    // 3. RPC fonksiyonunu çağırarak üyeyi sil/davetiyi iptal et
    const { data: result, error: rpcError } = await supabase.rpc('remove_project_member', {
      p_project_id: projectId,
      p_member_id: memberId,
    });

    if (rpcError) {
      console.error('RPC çağrısında hata:', rpcError.message);
      console.error('Hata detayı:', rpcError.details);
      // RPC'den dönen hata mesajını kullanabiliriz
      return {
        success: false,
        error: rpcError.message || 'Member could not be removed.',
      };
    }

    // RPC sonucu `{ success: boolean, message: string }` formatında dönmeli
    if (!result || typeof result.success === 'undefined') {
      console.error('RPC sonucu beklenmeyen formatta:', result);
      return { success: false, error: 'An unexpected server response occurred.' };
    }

    if (!result.success) {
      console.warn(
        'Üye çıkarma/davet iptali RPC tarafından başarısız olarak işaretlendi:',
        result.message
      );
      return { success: false, error: result.message || 'Member could not be removed.' };
    }

    // İşlem başarılıysa
    console.log('Üye başarıyla çıkarıldı veya davet iptal edildi (RPC ile)');
    console.log('=== SERVER ACTION: removeProjectMember başarıyla tamamlandı ===');
    return { success: true, message: result.message || 'Action completed successfully.' };
  } catch (error: any) {
    console.error('Üye çıkarılırken beklenmeyen hata:', error);
    console.log('=== SERVER ACTION: removeProjectMember hata ile tamamlandı ===');
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Projeye üye ekleyen fonksiyon
 * @param projectId Proje ID
 * @param userId Eklenecek kullanıcı ID'si
 * @param email Davet edilecek e-posta
 * @param role Rol
 * @returns Başarılı mı?
 */
export async function addProjectMember(
  projectId: string,
  userId: string | null,
  email: string,
  role: string = 'member'
) {
  try {
    /* console.log('=== SERVER ACTION: addProjectMember başladı ===');
    console.log('Proje ID:', projectId);
    console.log('Kullanıcı ID:', userId || 'null');
    console.log('E-posta:', email);
    console.log('Rol:', role); */

    // 1. Kullanıcı oturumunu kontrol et
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData?.session) {
      console.error('Aktif oturum bulunamadı, üye eklenemez');
      return { success: false, message: 'Session not found' };
    }

    const currentUserId = sessionData.session.user.id;

    // 2. RPC fonksiyonunu çağır
    const { data: result, error: rpcError } = await supabase.rpc('add_project_member', {
      p_project_id: projectId,
      p_user_id: currentUserId,
      p_invited_user_id: userId,
      p_invited_email: email,
      p_role: role,
    });

    if (rpcError) {
      console.error('RPC çağrısında hata:', rpcError.message);
      console.error('Hata detayı:', rpcError.details);
      return { success: false, message: rpcError.message };
    }

    // 3. E-posta daveti gönder
    if (email) {
      try {
        // sendInvitationEmail fonksiyonu bir nesne bekliyor
        await sendInvitationEmail({
          email,
          projectId,
          projectName: result?.project_name || 'ChainLab Projesi',
          invitationToken: result?.token || '',
          senderName: 'ChainLab',
          isRegistered: false,
        });
        console.log(`Davet e-postası gönderildi: ${email}`);
      } catch (emailError) {
        console.error('Davet e-postası gönderilirken hata:', emailError);
        // E-posta gönderilememesi kritik hata değil, işleme devam et
      }
    }

    console.log('Üye başarıyla eklendi');
    console.log('=== SERVER ACTION: addProjectMember başarıyla tamamlandı ===');
    return {
      success: true,
      message: 'Member added successfully',
      memberId: result?.id,
    };
  } catch (error) {
    console.error('Üye eklenirken beklenmeyen hata:', error);
    console.log('=== SERVER ACTION: addProjectMember hata ile tamamlandı ===');
    return { success: false, message: 'An unexpected error occurred' };
  }
}

/**
 * Cancel a pending email invitation by calling the RPC function.
 * Authorization is handled within the RPC function.
 * @param projectId - The ID of the project.
 * @param invitationId - The ID of the pending invitation (from pending_invitations table).
 * @returns Standard promise format { success: boolean, error?: string }
 */
export async function cancelPendingInvitation(
  projectId: string,
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('=== SERVER ACTION: cancelPendingInvitation started ===');
    console.log(`Project ID: ${projectId}, Invitation ID: ${invitationId}`);

    // Directly call the RPC function. Authorization is handled by the RPC.
    const { error: rpcError } = await supabase.rpc('cancel_pending_invitation', {
      p_project_id: projectId,
      p_invitation_id: invitationId,
    });

    // Check for RPC errors (including authorization errors from RPC)
    if (rpcError) {
      console.error('RPC call (cancel_pending_invitation) error:', rpcError.message);
      console.error('Error details:', rpcError.details);
      // Return the error message from the RPC
      return { success: false, error: rpcError.message || 'Invitation could not be cancelled.' };
    }

    // If RPC call succeeds without error
    console.log('Invitation cancelled successfully via RPC.');
    console.log('=== SERVER ACTION: cancelPendingInvitation completed successfully ===');
    return { success: true }; // Return success without error message
  } catch (error: any) {
    // Catch any unexpected errors during the action execution
    console.error('Unexpected error during cancelPendingInvitation action:', error);
    console.log('=== SERVER ACTION: cancelPendingInvitation completed with error ===');
    return { success: false, error: error.message || 'An unexpected server error occurred.' };
  }
}
