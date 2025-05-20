import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import CircularProgress from '@mui/material/CircularProgress';

// Hook'ları import et
import { useProjectInvitation } from 'src/hooks/projects';

import { fToNow } from 'src/utils/format-time';

import { CONFIG } from 'src/global-config';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { FileThumbnail } from 'src/components/file-thumbnail';

// ----------------------------------------------------------------------

export type NotificationItemProps = {
  notification: {
    id: string;
    type: string; // 'project_invitation', 'friend', etc.
    title: string; // Formatted title from mapper
    category: string; // 'Invitations', 'Others'
    isUnread: boolean;
    avatarUrl?: string | null; // Inviter or project logo URL from mapper
    createdAt: Date; // Use Date object
    payload?: {
      // Store additional data here
      project_id?: string;
      project_name?: string;
      project_description?: string;
      project_logo_url?: string;
      inviter_fullname?: string;
      inviter_email?: string;
      inviter_avatar_url?: string;
      inviter_id?: string;
      member_id?: string; // For accepting/rejecting invitation
      // ... other type-specific payload data
    };
  };
};

const readerContent = (data: string) => (
  <Box
    dangerouslySetInnerHTML={{ __html: data }}
    sx={{
      '& p': { m: 0, typography: 'body2' },
      '& a': { color: 'inherit', textDecoration: 'none' },
      '& strong': { typography: 'subtitle2' },
    }}
  />
);

export function NotificationItem({ notification }: NotificationItemProps) {
  const { processing, responded, responseType, acceptInvitation, rejectInvitation } =
    useProjectInvitation();

  const handleAcceptInvitation = async () => {
    const memberId = notification.payload?.member_id;
    console.log('Accept button clicked, memberId:', memberId);
    if (!memberId) {
      console.error('ERROR: memberId value not found in payload!');
      return;
    }
    console.log('Calling acceptInvitation function...');
    const result = await acceptInvitation(memberId); // Directly send memberId
    console.log('acceptInvitation function result:', result);
  };

  const handleRejectInvitation = async () => {
    const memberId = notification.payload?.member_id;
    console.log('Reject button clicked, memberId:', memberId);
    if (!memberId) {
      console.error('ERROR: memberId value not found in payload!');
      return;
    }
    console.log('Calling rejectInvitation function...');
    const result = await rejectInvitation(memberId); // Directly send memberId
    console.log('rejectInvitation function result:', result);
  };

  const renderAvatar = () => {
    const avatar = notification.avatarUrl;

    return (
      <ListItemAvatar>
        {avatar ? (
          <Avatar src={avatar} sx={{ bgcolor: 'background.neutral' }} />
        ) : (
          // Fallback Avatar (Örn: kategoriye göre ikon)
          <Avatar sx={{ bgcolor: 'background.neutral' }}>
            {notification.category === 'Invitations' && <Iconify icon="solar:user-plus-bold" />}
            {/* Diğer kategoriler için ikonlar eklenebilir */}
          </Avatar>
        )}
      </ListItemAvatar>
    );
  };

  const renderText = () => (
    <ListItemText
      disableTypography
      primary={readerContent(notification.title)} // Title'ı doğrudan kullan
      secondary={
        <Stack
          direction="row"
          alignItems="center"
          sx={{ typography: 'caption', color: 'text.disabled' }}
        >
          <Iconify icon="solar:copy-bold" width={16} sx={{ mr: 0.5 }} />
          <Typography variant="caption" component="span">
            {/* createdAt Date objesi olduğu için fToNow ile formatla */}
            {notification.createdAt ? fToNow(notification.createdAt) : 'Zaman bilgisi yok'}
          </Typography>
        </Stack>
      }
      sx={{ mb: 0.5 }}
    />
  );

  const renderUnReadBadge = () =>
    notification.isUnread && (
      <Box
        sx={{
          top: 26,
          width: 8,
          height: 8,
          right: 20,
          borderRadius: '50%',
          bgcolor: 'info.main',
          position: 'absolute',
        }}
      />
    );

  const renderFriendAction = () => (
    <Box sx={{ gap: 1, mt: 1.5, display: 'flex' }}>
      <Button size="small" variant="contained">
        Accept
      </Button>
      <Button size="small" variant="outlined">
        Decline
      </Button>
    </Box>
  );

  const renderProjectInvitationAction = () => {
    if (responded) {
      return (
        <Box sx={{ mt: 1.5 }}>
          <Label variant="filled" color={responseType === 'accepted' ? 'success' : 'error'}>
            {responseType === 'accepted' ? 'Accepted' : 'Rejected'}
          </Label>
        </Box>
      );
    }

    return (
      <Box sx={{ gap: 1, mt: 1.5, display: 'flex' }}>
        <Button
          size="small"
          variant="contained"
          color="success"
          onClick={handleAcceptInvitation} // Güncellenmiş handler
          disabled={processing} // Genel processing state'i
          startIcon={processing ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {processing ? 'Processing...' : 'Accept'}
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          onClick={handleRejectInvitation} // Güncellenmiş handler
          disabled={processing} // Genel processing state'i
        >
          Reject
        </Button>
      </Box>
    );
  };

  const renderProjectAction = () => (
    <>
      <Box
        sx={{
          p: 1.5,
          my: 1.5,
          borderRadius: 1.5,
          color: 'text.secondary',
          bgcolor: 'background.neutral',
        }}
      >
        {readerContent(
          `<p><strong>@Jaydon Frankie</strong> feedback by asking questions or just leave a note of appreciation.</p>`
        )}
      </Box>

      <Button size="small" variant="contained" sx={{ alignSelf: 'flex-start' }}>
        Reply
      </Button>
    </>
  );

  const renderFileAction = () => (
    <Box
      sx={(theme) => ({
        p: theme.spacing(1.5, 1.5, 1.5, 1),
        gap: 1,
        mt: 1.5,
        display: 'flex',
        borderRadius: 1.5,
        bgcolor: 'background.neutral',
      })}
    >
      <FileThumbnail file="http://localhost:8080/httpsdesign-suriname-2015.mp3" />

      <ListItemText
        primary="design-suriname-2015.mp3 design-suriname-2015.mp3"
        secondary="2.3 Mb"
        slotProps={{
          primary: {
            noWrap: true,
            sx: (theme) => ({
              color: 'text.secondary',
              fontSize: theme.typography.pxToRem(13),
            }),
          },
          secondary: {
            sx: {
              mt: 0.25,
              typography: 'caption',
              color: 'text.disabled',
            },
          },
        }}
      />

      <Button size="small" variant="outlined" sx={{ flexShrink: 0 }}>
        Download
      </Button>
    </Box>
  );

  const renderTagsAction = () => (
    <Box
      sx={{
        mt: 1.5,
        gap: 0.75,
        display: 'flex',
        flexWrap: 'wrap',
      }}
    >
      <Label variant="outlined" color="info">
        Design
      </Label>
      <Label variant="outlined" color="warning">
        Dashboard
      </Label>
      <Label variant="outlined">Design system</Label>
    </Box>
  );

  const renderPaymentAction = () => (
    <Box sx={{ gap: 1, mt: 1.5, display: 'flex' }}>
      <Button size="small" variant="contained">
        Pay
      </Button>
      <Button size="small" variant="outlined">
        Decline
      </Button>
    </Box>
  );

  return (
    <ListItemButton
      disableRipple
      sx={(theme) => ({
        p: 2.5,
        alignItems: 'flex-start',
        borderBottom: `dashed 1px ${theme.vars.palette.divider}`,
        ...(notification.isUnread && {
          // Okunmamışsa arka planı değiştir
          bgcolor: 'action.hover',
        }),
      })}
    >
      {renderUnReadBadge()}
      {renderAvatar()}

      <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
        {renderText()}
        {notification.type === 'friend' && renderFriendAction()}
        {notification.type === 'project_invitation' && renderProjectInvitationAction()}
        {notification.type === 'project' && renderProjectAction()}
        {notification.type === 'file' && renderFileAction()}
        {notification.type === 'tags' && renderTagsAction()}
        {notification.type === 'payment' && renderPaymentAction()}
      </Box>
    </ListItemButton>
  );
}
