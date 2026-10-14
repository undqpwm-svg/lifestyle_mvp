import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/auth/auth-context';

import type { CityId } from '@/config/cities';

import { api } from './client';
import type {
  Attachment,
  ChatMessage,
  CommunityInput,
  EventFilter,
  EventInput,
  ID,
  InterestId,
  LocalMedia,
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
  messages: (id: ID) => ['messages', id] as const,
};

// Чтение
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

// Чат: пока бэкенда нет — опрос раз в 4 секунды; с сервером — WebSocket, опрос как запасной канал.
export const useMessages = (communityId: ID, enabled: boolean) =>
  useQuery({
    queryKey: qk.messages(communityId),
    queryFn: () => api.listMessages(communityId),
    enabled,
    refetchInterval: 4000,
  });

// Изменение
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

export type OutgoingMessage = {
  text: string;
  images: (LocalMedia & { width: number; height: number })[];
  voice?: LocalMedia & { durationMs: number };
};

/** Отправка с оптимистичным показом: сообщение сразу появляется в чате со статусом «отправляется». */
export function useSendMessage(communityId: ID) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const key = qk.messages(communityId);

  return useMutation({
    mutationFn: async (out: OutgoingMessage) => {
      const attachments: Attachment[] = [];
      for (const img of out.images) {
        const { url } = await api.uploadMedia(img);
        attachments.push({ kind: 'image', url, width: img.width, height: img.height });
      }
      if (out.voice) {
        const { url } = await api.uploadMedia(out.voice);
        attachments.push({ kind: 'voice', url, durationMs: out.voice.durationMs });
      }
      return api.sendMessage(communityId, { text: out.text, attachments });
    },
    onMutate: async (out) => {
      await qc.cancelQueries({ queryKey: key });
      const temp: ChatMessage = {
        id: `temp-${Date.now()}`,
        communityId,
        authorId: user?.id ?? '',
        authorName: user?.name ?? '',
        text: out.text.trim(),
        attachments: [
          ...out.images.map((i) => ({ kind: 'image' as const, url: i.uri, width: i.width, height: i.height })),
          ...(out.voice ? [{ kind: 'voice' as const, url: out.voice.uri, durationMs: out.voice.durationMs }] : []),
        ],
        createdAt: new Date().toISOString(),
        pending: true,
      };
      qc.setQueryData<ChatMessage[]>(key, (old) => [temp, ...(old ?? [])]);
      return { tempId: temp.id };
    },
    onError: (_e, _out, ctx) => {
      qc.setQueryData<ChatMessage[]>(key, (old) => old?.filter((m) => m.id !== ctx?.tempId));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteMessage(communityId: ID) {
  const qc = useQueryClient();
  const key = qk.messages(communityId);
  return useMutation({
    mutationFn: (messageId: ID) => api.deleteMessage(messageId),
    onMutate: (messageId) => qc.setQueryData<ChatMessage[]>(key, (old) => old?.filter((m) => m.id !== messageId)),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
