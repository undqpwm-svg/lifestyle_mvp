import { ApiError, getAuthToken, type Api } from './api';
import type { PaymentInput } from './types';

const TIMEOUT_MS = 15_000;

export function createHttpApi(baseUrl: string): Api {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const token = getAuthToken();
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined && { 'Content-Type': 'application/json' }),
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      if (res.status === 204) return undefined as T;
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        // Сервер отвечает { error: { code, message } }
        const err = json?.error;
        const fallback = res.status === 401 ? 'unauthorized' : res.status === 404 ? 'not_found' : 'server';
        throw new ApiError(err?.code ?? fallback, err?.message, res.status);
      }
      return json as T;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError('network', controller.signal.aborted ? 'timeout' : String(e));
    } finally {
      clearTimeout(timer);
    }
  }

  const q = (params: Record<string, string | undefined>) => {
    const s = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
      .join('&');
    return s ? `?${s}` : '';
  };
  const id = encodeURIComponent;

  // Данные карты на наш сервер не отправляются никогда (PCI DSS). В продакшене карту принимает
  // форма/SDK эквайера и отдаёт токен; Kaspi — сервер возвращает ссылку на оплату в приложении Kaspi.
  const paymentBody = (p: PaymentInput) => ({ method: p.method, useBonus: !!p.useBonus });

  return {
    requestCode: (phone) => request('POST', '/v1/auth/otp', { phone }),
    verifyCode: (phone, code) => request('POST', '/v1/auth/otp/verify', { phone, code }),
    me: () => request('GET', '/v1/me'),
    updateProfile: (input) => request('PATCH', '/v1/me', input),
    applyReferral: (code) => request('POST', '/v1/me/referral', { code }),
    updateAvatar: (avatarUrl) => request('PATCH', '/v1/me', { avatarUrl }),
    registerPushToken: (token) => request('POST', '/v1/me/push-tokens', { token }),

    listEvents: (f) =>
      request('GET', `/v1/events${q({ city: f.cityId, interest: f.interestId, hostType: f.hostType, hostId: f.hostId })}`),
    getEvent: (eid) => request('GET', `/v1/events/${id(eid)}`),
    listRecommended: (city) => request('GET', `/v1/events/recommended${q({ city })}`),
    getEventAttendees: (eid) => request('GET', `/v1/events/${id(eid)}/attendees`),
    promoteEvent: (eid, payment) => request('POST', `/v1/events/${id(eid)}/promotion`, paymentBody(payment)),
    createEvent: (input) => request('POST', '/v1/events', input),
    cancelEvent: (eid) => request('POST', `/v1/events/${id(eid)}/cancel`),
    payEventListing: (eid, payment) => request('POST', `/v1/events/${id(eid)}/listing-payment`, paymentBody(payment)),

    myBookings: () => request('GET', '/v1/me/bookings'),
    book: (eventId, options) =>
      request('POST', `/v1/events/${id(eventId)}/bookings`, { useSubscription: !!options?.useSubscription, seats: options?.seats ?? 1 }),
    getBooking: (bid) => request('GET', `/v1/bookings/${id(bid)}`),
    joinWaitlist: (eid) => request('POST', `/v1/events/${id(eid)}/waitlist`),
    leaveWaitlist: (eid) => request('DELETE', `/v1/events/${id(eid)}/waitlist/me`),
    listParticipants: (eid) => request('GET', `/v1/events/${id(eid)}/participants`),
    checkIn: (eid, code) => request('POST', `/v1/events/${id(eid)}/check-in`, { code }),
    orgStats: (oid) => request('GET', `/v1/organizations/${id(oid)}/stats`),
    listReviews: (host) => request('GET', `/v1/reviews${q({ hostType: host.type, hostId: host.id })}`),
    createReview: (eid, rating, text) => request('POST', `/v1/events/${id(eid)}/reviews`, { rating, text }),
    getUserProfile: (uid) => request('GET', `/v1/users/${id(uid)}`),
    listFriends: () => request('GET', '/v1/me/friends'),
    sendFriendRequest: (uid) => request('POST', `/v1/users/${id(uid)}/friend-request`),
    respondFriendRequest: (uid, accept) => request('POST', `/v1/users/${id(uid)}/friend-request/${accept ? 'accept' : 'decline'}`),
    listConversations: () => request('GET', '/v1/me/conversations'),
    openConversation: (uid) => request('POST', '/v1/me/conversations', { userId: uid }),
    getConversation: (cid) => request('GET', `/v1/conversations/${id(cid)}`),
    listDirectMessages: (cid) => request('GET', `/v1/conversations/${id(cid)}/messages`),
    sendDirectMessage: (cid, message) => request('POST', `/v1/conversations/${id(cid)}/messages`, message),
    deleteDirectMessage: (mid) => request('DELETE', `/v1/direct-messages/${id(mid)}`),
    markConversationRead: (cid) => request('POST', `/v1/conversations/${id(cid)}/read`),
    setTyping: (cid) => request('POST', `/v1/conversations/${id(cid)}/typing`),
    removeFriend: (uid) => request('DELETE', `/v1/me/friends/${id(uid)}`),
    blockUser: (uid) => request('POST', '/v1/me/blocks', { userId: uid }),
    unblockUser: (uid) => request('DELETE', `/v1/me/blocks/${id(uid)}`),
    listBlocked: () => request('GET', '/v1/me/blocks'),
    listNotifications: () => request('GET', '/v1/me/notifications'),
    markNotificationsRead: () => request('POST', '/v1/me/notifications/read'),
    payBooking: (bid, payment) => request('POST', `/v1/bookings/${id(bid)}/pay`, paymentBody(payment)),

    mySubscription: () => request('GET', '/v1/me/subscription'),
    subscribe: (payment) => request('POST', '/v1/me/subscription', paymentBody(payment)),
    cancelSubscription: () => request('POST', '/v1/me/subscription/cancel'),
    cancelBooking: (bid) => request('POST', `/v1/bookings/${id(bid)}/cancel`),

    myOrganizations: () => request('GET', '/v1/me/organizations'),
    getOrganization: (oid) => request('GET', `/v1/organizations/${id(oid)}`),
    createOrganization: (input) => request('POST', '/v1/organizations', input),

    listCommunities: (p) =>
      request('GET', `/v1/communities${q({ city: p.cityId, interest: p.interestId, q: p.query })}`),
    myCommunities: () => request('GET', '/v1/me/communities'),
    getCommunity: (cid) => request('GET', `/v1/communities/${id(cid)}`),
    createCommunity: (input) => request('POST', '/v1/communities', input),
    joinCommunity: (cid) => request('POST', `/v1/communities/${id(cid)}/members`),
    leaveCommunity: (cid) => request('DELETE', `/v1/communities/${id(cid)}/members/me`),
    listPosts: (cid) => request('GET', `/v1/communities/${id(cid)}/posts`),
    createPost: (cid, text) => request('POST', `/v1/communities/${id(cid)}/posts`, { text }),

    listMessages: (cid) => request('GET', `/v1/communities/${id(cid)}/messages`),
    sendMessage: (cid, message) => request('POST', `/v1/communities/${id(cid)}/messages`, message),
    deleteMessage: (mid) => request('DELETE', `/v1/messages/${id(mid)}`),
    // Двухшаговая загрузка: сервер выдаёт подписанный URL хранилища, файл идёт туда напрямую,
    // минуя API — так тяжёлые фото и аудио не нагружают бэкенд.
    uploadMedia: async (file) => {
      const { uploadUrl, url } = await request<{ uploadUrl: string; url: string }>('POST', '/v1/media', {
        kind: file.kind,
        mimeType: file.mimeType,
      });
      const blob = await (await fetch(file.uri)).blob();
      const res = await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': file.mimeType ?? blob.type } });
      if (!res.ok) throw new ApiError('server', `upload ${res.status}`, res.status);
      return { url };
    },

    report: (target, targetId, reason) => request('POST', '/v1/reports', { target, targetId, reason }),
  };
}
