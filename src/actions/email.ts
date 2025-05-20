'use server';

import { Resend } from 'resend';
import { render } from '@react-email/render';

import { InviteEmail } from 'src/templates';
/**
 * Sends project invitation email
 */
export async function sendInvitationEmail({
  email,
  projectName,
  invitationToken,
  projectId,
  inviteMessage,
  senderName = 'ChainLab Team',
  isRegistered = true,
}: {
  email: string;
  projectName: string;
  invitationToken: string;
  projectId: string;
  inviteMessage?: string;
  senderName?: string;
  isRegistered?: boolean;
}) {
  try {
    // Log environment variables for debugging
    console.log('Checking environment variables:', {
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      hasResendApiKey: !!process.env.RESEND_API_KEY,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8082';

    // Kayıtlı kullanıcılar için dashboard'a yönlendir
    // Kayıtsız kullanıcılar için doğru kayıt sayfasına yönlendir
    const path = isRegistered
      ? `/dashboard/projects/${projectId}/invitation`
      : `/auth/supabase/sign-up`;

    const inviteLink = `${baseUrl}${path}?token=${invitationToken}`;
    console.log('Generated invite link:', inviteLink);

    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not defined!');
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    console.log('Resend client created, sending email...');

    const emailElement = InviteEmail({
      inviteLink,
      projectName,
      senderName,
      inviteMessage,
      recipientEmail: email,
    });

    const emailHtml = await render(emailElement as React.ReactElement);

    const { data, error } = await resend.emails.send({
      from: 'ChainLab <onboarding@resend.dev>',
      to: email,
      subject: `You have been invited to the ${projectName} Project`,
      html: emailHtml,
    });

    if (error) {
      console.error('Email sending error:', error);
      throw new Error(error.message);
    }

    console.log('Email sent successfully:', { messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('Email sending error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw new Error('Email could not be sent: ' + (error.message || 'Unknown error'));
  }
}
