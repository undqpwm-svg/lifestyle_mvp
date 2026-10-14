import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CityId } from '@/config/cities';

import { api } from './client';
import type {
  CommunityInput,
  EventFilter,
  EventInput,
  ID,
  InterestId,
  OrganizationInput,
  ReportReason,
  ReportTarget,
} from './types';

// Ключи кэша. Мутации инвалидируют по префиксу: ['events'] сбросит и ленту, и карточки.
export const qk = {
  events: (f?: EventFilter): readonly unknown[] => (f ? ['events', 'list', f] : ['events']),
  event: (id: ID) => ['events', 'detail', id] as const,
  bookings: ['bookings'] as const,
  myOrgs: ['organizations', 'mine'] as const,
  org: (id: ID) => ['organizations', 'detail', id] as const,
  communities: (p?: object): readonly unknown[] => (p ? ['communities', 'list', p] : ['communities']),
  myCommunities: ['communities', 'mine'] as const,
  community: (id: ID) => ['communities', 'detail', id] as const,
  posts: (id: ID) => ['posts', id] as const,
};

// ── Чтение ───────────────────────────────────────────────────
export const useEvents = (f: EventFilter) => useQuery({ queryKey: qk.events(f), queryFn: () => api.listEvents(f) });
export const useEvent = (id: ID) => useQuery({ queryKey: qk.event(id), queryFn: () => api.getEvent(id) });
export const useMyBookings = () => useQuery({ queryKey: qk.bookings, queryFn: () => api.myBookings() });
export const useMyOrganizations = () => useQuery({ queryKey: qk.myOrgs, queryFn: () => api.myOrganizations() });
export const useOrganization = (id: ID) => useQuery({ queryKey: qk.org(id), queryFn: () => api.getOrganization(id) });
export const useCommunities = (p: { cityId: CityId; interestId?: InterestId; query?: string }) =>
  useQuery({ queryKey: qk.communities(p), queryFn: () => api.listCommunities(p) });
export const useMyCommunities = () => useQuery({ queryKey: qk.myCommunities, queryFn: () => api.myCommunities() });
export const useCommunity = (id: ID) => useQuery({ queryKey: qk.community(id), queryFn: () => api.getCommunity(id) });
export const usePosts = (communityId: ID) =>
  useQuery({ queryKey: qk.posts(communityId), queryFn: () => api.listPosts(communityId) });

// ── Изменение ────────────────────────────────────────────────
function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: readonly (readonly unknown[])[]) =>
    Promise.all(keys.map((queryKey) => qc.invalidateQueries({ queryKey })));
}

export function useBook() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (eventId: ID) => api.book(eventId),
    onSuccess: () => invalidate(qk.events(), qk.bookings),
  });
}

export function usePayBooking() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (bookingId: ID) => api.payBooking(bookingId),
    onSuccess: () => invalidate(qk.events(), qk.bookings),
  });
}

export function useCancelBooking() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (bookingId: ID) => api.cancelBooking(bookingId),
    onSuccess: () => invalidate(qk.events(), qk.bookings),
  });
}

export function useCreateEvent() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: EventInput) => api.createEvent(input),
    onSuccess: () => invalidate(qk.events()),
  });
}

export function useCancelEvent() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: ID) => api.cancelEvent(id),
    onSuccess: () => invalidate(qk.events(), qk.bookings),
  });
}

export function useCreateOrganization() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: OrganizationInput) => api.createOrganization(input),
    onSuccess: () => invalidate(qk.myOrgs),
  });
}

export function useCreateCommunity() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: CommunityInput) => api.createCommunity(input),
    onSuccess: () => invalidate(qk.communities()),
  });
}

export function useJoinCommunity() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, join }: { id: ID; join: boolean }) => (join ? api.joinCommunity(id) : api.leaveCommunity(id)),
    onSuccess: () => invalidate(qk.communities()),
  });
}

export function useCreatePost(communityId: ID) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (text: string) => api.createPost(communityId, text),
    onSuccess: () => invalidate(qk.posts(communityId)),
  });
}

export function useReport() {
  return useMutation({
    mutationFn: (v: { target: ReportTarget; targetId: ID; reason: ReportReason }) =>
      api.report(v.target, v.targetId, v.reason),
  });
}
