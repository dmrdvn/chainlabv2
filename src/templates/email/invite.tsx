import * as React from 'react';
import {
  Img,
  Body,
  Head,
  Html,
  Link,
  Text,
  Button,
  Heading,
  Preview,
  Section,
  Container,
} from '@react-email/components';

interface InviteEmailProps {
  inviteLink: string;
  projectName: string;
  senderName?: string;
  inviteMessage?: string;
  recipientEmail: string;
}

export const InviteEmail: React.FC<InviteEmailProps> = ({
  inviteLink,
  projectName,
  senderName = 'ChainLab Team',
  inviteMessage,
  recipientEmail,
}) => {
  const previewText = `You've been invited to the ${projectName} project`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8082';

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Img
              src={`${baseUrl}/logo/logo-full.png`}
              width="120"
              height="40"
              alt="ChainLab"
              style={logoStyle}
            />
          </Section>
          <Section style={contentStyle}>
            <Heading style={headingStyle}>Project Invitation</Heading>
            <Text style={paragraphStyle}>Hello,</Text>
            <Text style={paragraphStyle}>
              <strong>{senderName}</strong> invites you to the <strong>{projectName}</strong>{' '}
              project.
            </Text>

            {inviteMessage && (
              <Section style={messageBoxStyle}>
                <Text style={messageTextStyle}>{inviteMessage}</Text>
              </Section>
            )}

            <Section style={buttonContainerStyle}>
              <Button href={inviteLink} style={buttonStyle}>
                Accept Invitation
              </Button>
            </Section>

            <Text style={linkTextStyle}>
              Or copy and paste this link into your browser:{' '}
              <Link href={inviteLink} style={linkStyle}>
                {inviteLink}
              </Link>
            </Text>
          </Section>
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              This email was sent to {recipientEmail}. If you were not expecting this invitation,
              please ignore this email.
            </Text>
            <Text style={footerTextStyle}>
              &copy; {new Date().getFullYear()} ChainLab. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// CSS Stilleri
const bodyStyle = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
};

const containerStyle = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
};

const headerStyle = {
  padding: '25px 0',
  textAlign: 'center' as const,
};

const logoStyle = {
  margin: '0 auto',
};

const contentStyle = {
  backgroundColor: '#ffffff',
  padding: '30px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
};

const headingStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#252f3f',
  marginBottom: '20px',
};

const paragraphStyle = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#3c4257',
};

const messageBoxStyle = {
  backgroundColor: '#f8f9fa',
  padding: '15px',
  borderRadius: '5px',
  borderLeft: '4px solid #0070f3',
  margin: '20px 0',
};

const messageTextStyle = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#4b5563',
  margin: '0',
  fontStyle: 'italic',
};

const buttonContainerStyle = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const buttonStyle = {
  backgroundColor: '#0070f3',
  borderRadius: '5px',
  color: '#fff',
  fontWeight: 'bold',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 30px',
};

const linkTextStyle = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '16px 0',
};

const linkStyle = {
  color: '#0070f3',
  textDecoration: 'underline',
};

const footerStyle = {
  textAlign: 'center' as const,
  padding: '20px',
};

const footerTextStyle = {
  fontSize: '13px',
  color: '#8898aa',
  lineHeight: '21px',
};

export default InviteEmail;
