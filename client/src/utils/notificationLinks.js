// Where a notification click should land, per notification type and per role.
//
// An explicit `link` on the notification always wins - the server knows more
// about the event than the type alone does. Everything else is derived from the
// type plus whichever id the notification carries. A type that resolves to the
// other role's area falls back to that role's overview, so a mis-routed
// notification can never dump a customer into the admin panel.

export const CUSTOMER_FALLBACK = '/dashboard';
export const ADMIN_FALLBACK = '/admin';

const CUSTOMER_DESTINATIONS = {
  enquiry: (id) => (id ? `/dashboard?tab=enquiries&enquiry=${id}` : '/dashboard?tab=enquiries'),
  order: (id) => (id ? `/dashboard?tab=orders&order=${id}` : '/dashboard?tab=orders'),
  payment: (id) => (id ? `/dashboard?tab=orders&order=${id}` : '/dashboard?tab=orders'),
  message: (id) => (id ? `/dashboard?tab=messages&chat=${id}` : '/dashboard?tab=messages'),
  review: () => '/dashboard',
  deal: (id) => (id ? `/dashboard?tab=enquiries&enquiry=${id}` : '/dashboard?tab=enquiries'),
  price: (id) => (id ? `/dashboard?tab=enquiries&enquiry=${id}` : '/dashboard?tab=enquiries'),
  rewards: () => '/dashboard?tab=rewards',
  promotion: () => '/dashboard?tab=rewards',
  wishlist: () => '/dashboard?tab=wishlist',
  system: () => CUSTOMER_FALLBACK,
};

const ADMIN_DESTINATIONS = {
  enquiry: (id) => (id ? `/admin/enquiries?enquiry=${id}` : '/admin/enquiries'),
  order: (id) => (id ? `/admin/orders?order=${id}` : '/admin/orders'),
  payment: (id) => (id ? `/admin/orders?order=${id}` : '/admin/orders'),
  message: (id) => (id ? `/admin/messages?chat=${id}` : '/admin/messages'),
  review: (id) => (id ? `/admin/products?review=${id}` : '/admin/products'),
  deal: (id) => (id ? `/admin/enquiries?enquiry=${id}` : '/admin/enquiries'),
  price: (id) => (id ? `/admin/enquiries?enquiry=${id}` : '/admin/enquiries'),
  rewards: () => ADMIN_FALLBACK,
  promotion: () => ADMIN_FALLBACK,
  wishlist: () => ADMIN_FALLBACK,
  system: () => ADMIN_FALLBACK,
};

const STRIP_PREFIXES = {
  'conv-': '',
  'order-': '',
  'payment-': '',
};

const stripSyntheticPrefix = (id) => {
  if (typeof id !== 'string') return id ?? null;
  const prefix = Object.keys(STRIP_PREFIXES).find((p) => id.startsWith(p));
  return prefix ? id.slice(prefix.length) : id;
};

// The id the destination page keys off, whichever spelling the notification
// used to carry it.
export const getRefId = (notification) => {
  if (!notification) return null;
  return stripSyntheticPrefix(
    notification.enquiryId ||
      notification.orderId ||
      notification.conversationId ||
      notification.chatId ||
      notification.refId ||
      null
  );
};

const isAdminLink = (url) => typeof url === 'string' && url.startsWith('/admin');

/**
 * Build the URL a notification should navigate to.
 * @param {object} notification the notification row
 * @param {'customer'|'admin'} role who is clicking
 * @returns {string} a path safe for that role to be sent to
 */
export const buildNotificationLink = (notification, role) => {
  const isAdmin = role === 'admin';
  const fallback = isAdmin ? ADMIN_FALLBACK : CUSTOMER_FALLBACK;

  if (!notification) return fallback;

  // An explicit link is only honoured if it belongs to the clicker's side of
  // the app.
  const explicit = notification.link || notification.navigateTo;
  if (explicit && typeof explicit === 'string') {
    if (isAdminLink(explicit) === isAdmin) return explicit;
  }

  const table = isAdmin ? ADMIN_DESTINATIONS : CUSTOMER_DESTINATIONS;
  const build = table[notification.type];
  if (build) return build(getRefId(notification));

  return fallback;
};

export default buildNotificationLink;