'use client';

import type { IconButtonProps } from '@mui/material/IconButton';

import { m } from 'framer-motion';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import SvgIcon from '@mui/material/SvgIcon';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomTabs } from 'src/components/custom-tabs';
import { EmptyContent } from 'src/components/empty-content';
import { varTap, varHover, transitionTap } from 'src/components/animate';

import { NotificationItem } from './notification-item';

import type { NotificationItemProps } from './notification-item';

// ----------------------------------------------------------------------

// Bildirim tipleri için kategorizasyon
enum NotificationType {
  All = 'all',
  Invitations = 'project_invitation',
  Others = 'others',
}

const TABS = [
  { value: NotificationType.All, label: 'All', count: 0 },
  { value: NotificationType.Invitations, label: 'Invitations', count: 0 },
  { value: NotificationType.Others, label: 'Others', count: 0 },
];

// ----------------------------------------------------------------------

export type NotificationsDrawerProps = IconButtonProps & {
  data?: NotificationItemProps['notification'][];
  loading?: boolean;
  error?: Error | null;
};

export function NotificationsDrawer({
  data = [],
  loading = false,
  error = null,
  sx,
  ...other
}: NotificationsDrawerProps) {
  const { value: open, onTrue: onOpen, onFalse: onClose } = useBoolean();

  const [currentTab, setCurrentTab] = useState<string>(NotificationType.All);

  // Bildirim işleme durumunu ele al
  const notifications = useMemo(() => {
    if (loading || error) {
      return [];
    }
    return data;
  }, [data, loading, error]);

  const handleChangeTab = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  }, []);

  // Bildirim sayılarını hesapla
  const notificationCounts = useMemo(() => {
    const invitationsCount = notifications.filter(
      (item) => item.type === NotificationType.Invitations
    ).length;
    const othersCount = notifications.filter(
      (item) => item.type !== NotificationType.Invitations
    ).length;

    return {
      invitations: invitationsCount,
      others: othersCount,
      total: notifications.length,
    };
  }, [notifications]);

  // Tabs dizisini güncel bildirim sayıları ile güncelle
  const updatedTabs = useMemo(
    () =>
      TABS.map((tab) => ({
        ...tab,
        count:
          tab.value === NotificationType.All
            ? notificationCounts.total
            : tab.value === NotificationType.Invitations
              ? notificationCounts.invitations
              : notificationCounts.others,
      })),
    [notificationCounts]
  );

  // Geçerli sekmeye göre bildirimleri filtrele
  const filteredNotifications = useMemo(() => {
    if (currentTab === NotificationType.All) {
      return notifications;
    }
    if (currentTab === NotificationType.Invitations) {
      return notifications.filter((item) => item.type === NotificationType.Invitations);
    }
    if (currentTab === NotificationType.Others) {
      return notifications.filter((item) => item.type !== NotificationType.Invitations);
    }
    return notifications;
  }, [currentTab, notifications]);

  const renderHead = () => (
    <Box
      sx={{
        py: 2,
        pr: 1,
        pl: 2.5,
        minHeight: 68,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Notifications
      </Typography>

      {!!notificationCounts.total && (
        <Tooltip title="Mark all as read">
          <IconButton color="primary" onClick={handleMarkAllAsRead}>
            <Iconify icon="eva:done-all-fill" />
          </IconButton>
        </Tooltip>
      )}

      <IconButton onClick={onClose} sx={{ display: { xs: 'inline-flex', sm: 'none' } }}>
        <Iconify icon="mingcute:close-line" />
      </IconButton>

      <IconButton>
        <Iconify icon="solar:settings-bold-duotone" />
      </IconButton>
    </Box>
  );

  const renderTabs = () => (
    <CustomTabs
      variant="scrollable"
      allowScrollButtonsMobile
      value={currentTab}
      onChange={handleChangeTab}
    >
      {updatedTabs.map((tab) => (
        <Tab
          key={tab.value}
          iconPosition="end"
          value={tab.value}
          label={tab.label}
          icon={
            <Label
              variant={
                ((tab.value === NotificationType.All || tab.value === currentTab) && 'filled') ||
                'soft'
              }
              color={
                (tab.value === NotificationType.Invitations && 'success') ||
                (tab.value === NotificationType.Others && 'info') ||
                'default'
              }
            >
              {tab.count}
            </Label>
          }
        />
      ))}
    </CustomTabs>
  );

  const renderList = () => {
    // Yükleme durumunu göster
    if (loading) {
      return (
        <Stack spacing={2} sx={{ p: 2.5 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            Loading notifications...
          </Typography>
        </Stack>
      );
    }

    // Hata durumunu göster
    if (error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          An error occurred while loading notifications: {error.message}
        </Alert>
      );
    }

    // Bildirim yoksa boş içerik göster
    if (filteredNotifications.length === 0) {
      return (
        <Box sx={{ p: 5 }}>
          <EmptyContent
            imgUrl="/logo/logo-full.svg"
            title="No notifications found"
            description={
              currentTab === NotificationType.Invitations
                ? "You don't have any project invitations yet."
                : currentTab === NotificationType.Others
                  ? 'No other notifications found yet.'
                  : "You don't have any notifications yet."
            }
            sx={{ py: 5 }}
          />
        </Box>
      );
    }

    // Bildirimleri listele
    return (
      <Scrollbar>
        <Box component="ul">
          {filteredNotifications.map((notification) => (
            <Box component="li" key={notification.id} sx={{ display: 'flex' }}>
              <NotificationItem notification={notification} />
            </Box>
          ))}
        </Box>
      </Scrollbar>
    );
  };

  const handleMarkAllAsRead = () => {
    // Tüm bildirimleri okundu olarak işaretlemek için burada bir işlem yapabilirsiniz
    // Şu anda bu fonksiyon pasif durumdadır
    console.log('All notifications marked as read');
  };

  return (
    <>
      <IconButton
        component={m.button}
        whileTap={varTap(0.96)}
        whileHover={varHover(1.04)}
        transition={transitionTap()}
        aria-label="Notifications button"
        onClick={onOpen}
        sx={sx}
        {...other}
      >
        <Badge badgeContent={notificationCounts.total} color="error">
          <SvgIcon>
            {/* https://icon-sets.iconify.design/solar/bell-bing-bold-duotone/ */}
            <path
              fill="currentColor"
              d="M18.75 9v.704c0 .845.24 1.671.692 2.374l1.108 1.723c1.011 1.574.239 3.713-1.52 4.21a25.794 25.794 0 0 1-14.06 0c-1.759-.497-2.531-2.636-1.52-4.21l1.108-1.723a4.393 4.393 0 0 0 .693-2.374V9c0-3.866 3.022-7 6.749-7s6.75 3.134 6.75 7"
              opacity="0.5"
            />
            <path
              fill="currentColor"
              d="M12.75 6a.75.75 0 0 0-1.5 0v4a.75.75 0 0 0 1.5 0zM7.243 18.545a5.002 5.002 0 0 0 9.513 0c-3.145.59-6.367.59-9.513 0"
            />
          </SvgIcon>
        </Badge>
      </IconButton>

      <Drawer
        open={open}
        onClose={onClose}
        anchor="right"
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{
          sx: { width: 370 },
        }}
      >
        {renderHead()}
        {renderTabs()}
        {renderList()}

        {/*  <Box sx={{ p: 1 }}>
          <Button fullWidth size="large">
            View All
          </Button>
        </Box> */}
      </Drawer>
    </>
  );
}
