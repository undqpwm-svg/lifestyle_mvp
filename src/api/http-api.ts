import { ApiError, getAuthToken, type Api } from './api';

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

  return {
    requestCode: (phone) => request('POST', '/v1/auth/otp', { phone }),
    verifyCode: (phone, code) => request('POST', '/v1/auth/otp/verify', { phone, code }),
    me: () => request('GET', '/v1/me'),
    updateProfile: (input) => request('PATCH', '/v1/me', input),

    listEvents: (f) =>
      request('GET', `/v1/events${q({ city: f.cityId, interest: f.interestId, hostType: f.hostType, hostId: f.hostId })}`),
    getEvent: (eid) => request('GET', `/v1/events/${id(eid)}`),
    createEvent: (input) => request('POST', '/v1/events', input),
    cancelEvent: (eid) => request('POST', `/v1/events/${id(eid)}/cancel`),

    myBookings: () => request('GET', '/v1/me/bookings'),
    book: (eventId) => request('POST', `/v1/events/${id(eventId)}/bookings`),
    payBooking: (bid) => request('POST', `/v1/bookings/${id(bid)}/pay`),
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

    report: (target, targetId, reason) => request('POST', '/v1/reports', { target, targetId, reason }),
  };
}
