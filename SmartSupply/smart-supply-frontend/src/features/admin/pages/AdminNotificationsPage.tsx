import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../../../api/notifications.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { SoftEmptyState } from '../../../components/ui/SoftEmptyState';
import { format } from 'date-fns';
import { Bell, AlertTriangle, Package, ShoppingBag } from 'lucide-react';
import { formatNotificationMessage, getOrderIdFromMessage, getOrderRefFromMessage } from '../../../utils/notificationUtils';
import { Link } from 'react-router-dom';

export const AdminNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    notificationsApi.getNotifications()
      .then(data => setNotifications(data || []))
      .catch(err => {
        console.error(err);
        setNotifications([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <SoftLoader />;

  if (!notifications || notifications.length === 0) {
    return (
      <div className="container-fluid p-0">
        <h4 className="fw-bold mb-4">Notifications</h4>
        <SoftCard className="h-100">
          <SoftEmptyState
            icon={<Bell size={48} />}
            title="No Notifications"
            description="You're all caught up! No new notifications at this time."
          />
        </SoftCard>
      </div>
    );
  }

  const getNotifMeta = (msg: string) => {
    if (msg.toLowerCase().includes('stock') || msg.toLowerCase().includes('alert')) {
      return { icon: <AlertTriangle size={18} />, color: 'var(--warning)' };
    }
    if (msg.toLowerCase().includes('order') || msg.toLowerCase().includes('commande')) {
      return { icon: <ShoppingBag size={18} />, color: 'var(--soft-primary)' };
    }
    return { icon: <Package size={18} />, color: 'var(--success)' };
  };

  return (
    <div className="container-fluid p-0">
      <h4 className="fw-bold mb-4">Notifications</h4>

      <SoftCard>
        <div className="list-group list-group-flush">
          {notifications.map((notif) => {
            const meta = getNotifMeta(notif.message);
            const targetOrderId = notif.commandeId || getOrderIdFromMessage(notif.message);
            const targetOrderRef = notif.commandeRef || getOrderRefFromMessage(notif.message);

            let linkTo = '#';
            if (targetOrderId) {
              linkTo = `/admin/orders?orderId=${targetOrderId}`;
            } else if (targetOrderRef) {
              linkTo = `/admin/orders?orderRef=${targetOrderRef}`;
            }

            return (
              <Link
                key={notif.id}
                to={linkTo}
                className={`list-group-item list-group-item-action d-flex align-items-start py-3 border-bottom text-decoration-none ${!notif.lue ? 'bg-body-tertiary' : ''}`}
                style={{
                  background: !notif.lue ? 'var(--soft-bg)' : 'transparent',
                  borderColor: 'var(--soft-border-subtle)',
                  cursor: linkTo !== '#' ? 'pointer' : 'default'
                }}
              >
                <div className="rounded-circle d-flex justify-content-center align-items-center me-3 mt-1" style={{ width: '36px', height: '36px', background: meta.color, color: 'white' }}>
                  {meta.icon}
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <h6 className={`mb-0 ${!notif.lue ? 'fw-bold' : ''}`} style={{ color: 'var(--soft-text)' }}>
                      {notif.message.includes(':') ? notif.message.split(':')[0] : 'Notification'}
                    </h6>
                    <small className="text-muted">{format(new Date(notif.dateCreation), 'MMM dd, yyyy HH:mm')}</small>
                  </div>
                  <p className="mb-0 text-muted small">
                    {formatNotificationMessage(notif.message.includes(':') ? notif.message.substring(notif.message.indexOf(':') + 1).trim() : notif.message)}
                  </p>
                </div>
                {!notif.lue && (
                  <div className="ms-3 mt-2">
                    <div className="rounded-circle" style={{ width: '8px', height: '8px', background: 'var(--soft-primary)' }}></div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </SoftCard>
    </div>
  );
};
