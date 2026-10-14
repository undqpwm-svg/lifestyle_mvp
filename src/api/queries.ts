import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/auth/auth-context';

import type { CityId } from '@/config/cities';

import { api } from './client';
import type {
  Attachment,
  CommunityInput,
  EventFilter,
  EventInput,
  HostType,
  ID,
  InterestId,
  LocalMedia,
  MessageView,
  NewMessage,
  OrganizationInput,
  PaymentInput,
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
  subscription: ['subscription'] as const,
  me: ['me'] as const,
  recommended: (cityId: CityId) => ['events', 'recommended', cityId] as const,
  attendees: (id: ID) => ['events', 'attendees', id] as const,
  booking: (id: ID) => ['bookings', id] as const,
  participants: (id: ID) => ['participants', id] as const,
  orgStats: (id: ID) => ['organizations', 'stats', id] as const,
  reviews: (type: HostType, id: ID) => ['reviews', type, id] as const,
  user: (id: ID) => ['users', id] as const,
  friends: ['friends'] as const,
  notifications: ['notifications'] as const,
  conversations: ['conversations'] as const,
  conversation: (id: ID) => ['conversations', id] as const,
  dms: (id: ID) => ['dms', id] as const,
  blocked: ['blocked'] as const,
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
    mutationFn: ({ eventId, useSubscription, seats }: { eventId: ID; useSubscription?: boolean; seats?: number }) =>
      api.book(eventId, { useSubscription, seats }),
    onSuccess: () => invalidate(qk.events(), qk.bookings, qk.subscription),
  });
}

export function usePayBooking() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ bookingId, payment }: { bookingId: ID; payment: PaymentInput }) => api.payBooking(bookingId, payment),
    onSuccess: () => invalidate(qk.events(), qk.bookings, qk.me),
  });
}

export function usePayEventListing() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ eventId, payment }: { eventId: ID; payment: PaymentInput }) => api.payEventListing(eventId, payment),
    onSuccess: () => invalidate(qk.events(), qk.me),
  });
}

export const useMySubscription = () => useQuery({ queryKey: qk.subscription, queryFn: () => api.mySubscription() });

export function useSubscribe() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payment: PaymentInput) => api.subscribe(payment),
    onSuccess: () => invalidate(qk.subscription, qk.me),
  });
}

export function useCancelSubscription() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: () => api.cancelSubscription(),
    onSuccess: () => invalidate(qk.subscription),
  });
}

export function useCancelBooking() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (bookingId: ID) => api.cancelBooking(bookingId),
    onSuccess: () => invalidate(qk.events(), qk.bookings, qk.subscription),
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
  /** Готовые вложения без загрузки (например, встреча, которой делятся) */
  extra?: Attachment[];
};

/** Загружает фото/голос в хранилище и собирает вложения сообщения. */
async function uploadAttachments(out: OutgoingMessage): Promise<Attachment[]> {
  const attachments: Attachment[] = [...(out.extra ?? [])];
  for (const img of out.images) {
    const { url } = await api.uploadMedia(img);
    attachments.push({ kind: 'image', url, width: img.width, height: img.height });
  }
  if (out.voice) {
    const { url } = await api.uploadMedia(out.voice);
    attachments.push({ kind: 'voice', url, durationMs: out.voice.durationMs });
  }
  return attachments;
}

/**
 * Отправка с оптимистичным показом (общая для чата сообщества и личных сообщений):
 * сообщение сразу появляется в списке со статусом «отправляется», после ответа сервера список обновляется.
 */
function useOptimisticSend(key: readonly unknown[], send: (m: NewMessage) => Promise<unknown>, alsoInvalidate: readonly (readonly unknown[])[] = []) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (out: OutgoingMessage) => send({ text: out.text, attachments: await uploadAttachments(out) }),
    onMutate: async (out) => {
      await qc.cancelQueries({ queryKey: key });
      const temp: MessageView = {
        id: `temp-${Date.now()}`,
        authorId: user?.id ?? '',
        authorName: user?.name ?? '',
        text: out.text.trim(),
        attachments: [
          ...(out.extra ?? []),
          ...out.images.map((i) => ({ kind: 'image' as const, url: i.uri, width: i.width, height: i.height })),
          ...(out.voice ? [{ kind: 'voice' as const, url: out.voice.uri, durationMs: out.voice.durationMs }] : []),
        ],
        createdAt: new Date().toISOString(),
        pending: true,
      };
      qc.setQueryData<MessageView[]>(key, (old) => [temp, ...(old ?? [])]);
      return { tempId: temp.id };
    },
    onError: (_e, _out, ctx) => {
      qc.setQueryData<MessageView[]>(key, (old) => old?.filter((m) => m.id !== ctx?.tempId));
    },
    onSettled: () => Promise.all([key, ...alsoInvalidate].map((k) => qc.invalidateQueries({ queryKey: k }))),
  });
}

export const useSendMessage = (communityId: ID) =>
  useOptimisticSend(qk.messages(communityId), (m) => api.sendMessage(communityId, m));

function useOptimisticDelete(key: readonly unknown[], remove: (id: ID) => Promise<void>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: remove,
    onMutate: (messageId: ID) => qc.setQueryData<MessageView[]>(key, (old) => old?.filter((m) => m.id !== messageId)),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export const useDeleteMessage = (communityId: ID) => useOptimisticDelete(qk.messages(communityId), (id) => api.deleteMessage(id));

// Личные сообщения: опрос раз в 4 с в открытом диалоге, раз в 10 с — список диалогов
export const useConversations = () =>
  useQuery({ queryKey: qk.conversations, queryFn: () => api.listConversations(), refetchInterval: 10_000 });
/** В открытом диалоге опрашиваем чаще — чтобы «печатает…» и галочки обновлялись почти сразу (с сервером — WebSocket). */
export const useConversation = (id: ID) =>
  useQuery({ queryKey: qk.conversation(id), queryFn: () => api.getConversation(id), refetchInterval: 1500 });
export const useDirectMessages = (id: ID) =>
  useQuery({ queryKey: qk.dms(id), queryFn: () => api.listDirectMessages(id), refetchInterval: 2000 });
export const useSendDirectMessage = (conversationId: ID) =>
  useOptimisticSend(qk.dms(conversationId), (m) => api.sendDirectMessage(conversationId, m), [qk.conversations, qk.friends]);
export const useDeleteDirectMessage = (conversationId: ID) =>
  useOptimisticDelete(qk.dms(conversationId), (id) => api.deleteDirectMessage(id));

export function useOpenConversation() {
  return useMutation({ mutationFn: (userId: ID) => api.openConversation(userId) });
}

/** Отправить встречу в личку пользователю (кнопка «Поделиться»). */
export function useShareEvent() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ userId, attachment }: { userId: ID; attachment: Attachment }) => {
      const c = await api.openConversation(userId);
      return api.sendDirectMessage(c.id, { text: '', attachments: [attachment] });
    },
    onSuccess: () => invalidate(qk.conversations, qk.friends),
  });
}

// Профиль с бонусным балансом (сессия хранит только идентичность)
export const useProfile = () => useQuery({ queryKey: qk.me, queryFn: () => api.me() });

export function useApplyReferral() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (code: string) => api.applyReferral(code), onSuccess: () => invalidate(qk.me) });
}

export const useRecommended = (cityId: CityId) =>
  useQuery({ queryKey: qk.recommended(cityId), queryFn: () => api.listRecommended(cityId) });

export const useEventAttendees = (eventId: ID) =>
  useQuery({ queryKey: qk.attendees(eventId), queryFn: () => api.getEventAttendees(eventId) });

export function usePromoteEvent() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ eventId, payment }: { eventId: ID; payment: PaymentInput }) => api.promoteEvent(eventId, payment),
    onSuccess: () => invalidate(qk.events(), qk.me),
  });
}

export const useBooking = (bookingId: ID) => useQuery({ queryKey: qk.booking(bookingId), queryFn: () => api.getBooking(bookingId) });

export function useWaitlist() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ eventId, join }: { eventId: ID; join: boolean }) => (join ? api.joinWaitlist(eventId) : api.leaveWaitlist(eventId)),
    onSuccess: () => invalidate(qk.events()),
  });
}

export const useParticipants = (eventId: ID) =>
  useQuery({ queryKey: qk.participants(eventId), queryFn: () => api.listParticipants(eventId) });

export function useCheckIn(eventId: ID) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (code: string) => api.checkIn(eventId, code),
    onSuccess: () => invalidate(qk.participants(eventId), ['organizations', 'stats']),
  });
}

export const useOrgStats = (orgId: ID) => useQuery({ queryKey: qk.orgStats(orgId), queryFn: () => api.orgStats(orgId) });

export const useReviews = (type: HostType, id: ID) =>
  useQuery({ queryKey: qk.reviews(type, id), queryFn: () => api.listReviews({ type, id }) });

export function useCreateReview() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ eventId, rating, text }: { eventId: ID; rating: number; text: string }) => api.createReview(eventId, rating, text),
    onSuccess: () => invalidate(qk.bookings, ['reviews'], ['organizations'], ['communities']),
  });
}

export const useUserProfile = (userId: ID) => useQuery({ queryKey: qk.user(userId), queryFn: () => api.getUserProfile(userId) });
export const useFriends = () => useQuery({ queryKey: qk.friends, queryFn: () => api.listFriends() });

export type PersonAction = 'request' | 'accept' | 'decline' | 'remove' | 'block' | 'unblock';

/** Действия с человеком: заявка в друзья, ответ, удаление из друзей, блокировка. */
export function useFriendAction() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ userId, action }: { userId: ID; action: PersonAction }) => {
      switch (action) {
        case 'request':
          return api.sendFriendRequest(userId);
        case 'accept':
        case 'decline':
          return api.respondFriendRequest(userId, action === 'accept');
        case 'remove':
          return api.removeFriend(userId);
        case 'block':
          return api.blockUser(userId);
        case 'unblock':
          return api.unblockUser(userId);
      }
    },
    onSuccess: (_d, v) => invalidate(qk.user(v.userId), qk.friends, qk.events(), qk.blocked, ['conversations'], ['messages'], ['dms']),
  });
}

export const useBlocked = () => useQuery({ queryKey: qk.blocked, queryFn: () => api.listBlocked() });

export const useNotifications = () =>
  useQuery({ queryKey: qk.notifications, queryFn: () => api.listNotifications(), refetchInterval: 15_000 });

export function useMarkNotificationsRead() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: () => api.markNotificationsRead(), onSuccess: () => invalidate(qk.notifications) });
}

/** Загрузка аватарки: сжатое фото → хранилище → профиль. null — удалить. */
export function useUpdateAvatar() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (file: LocalMedia | null) => {
      if (!file) return api.updateAvatar(null);
      const { url } = await api.uploadMedia(file);
      return api.updateAvatar(url);
    },
    onSuccess: () => invalidate(qk.me, ['users'], qk.friends, ['conversations']),
  });
}
