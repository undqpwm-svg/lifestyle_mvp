import type {
  AppNotification,
  AuthResult,
  Booking,
  BookingWithEvent,
  ChatMessage,
  Conversation,
  DirectMessage,
  Friend,
  Community,
  CommunityInput,
  EventFilter,
  EventInput,
  EventItem,
  ID,
  InterestId,
  LocalMedia,
  NewMessage,
  Organization,
  OrganizationInput,
  OrgStats,
  Participant,
  PaymentInput,
  PublicProfile,
  PersonRef,
  Review,
  Post,
  ProfileInput,
  ReportReason,
  ReportTarget,
  Subscription,
  User,
} from './types';
import type { CityId } from '@/config/cities';

// Контракт клиента с сервером. Две реализации: mock-api.ts (до бэкенда) и http-api.ts.
export interface Api {
  // Авторизация по номеру телефона (SMS OTP)
  requestCode(phone: string): Promise<void>;
  verifyCode(phone: string, code: string): Promise<AuthResult>;
  me(): Promise<User>;
  updateProfile(input: ProfileInput): Promise<User>;
  /** URL из uploadMedia или null — удалить фото */
  updateAvatar(avatarUrl: string | null): Promise<User>;
  /** Промокод друга: оба получают бонусы. Один раз на аккаунт. */
  applyReferral(code: string): Promise<User>;
  /** Expo push-токен устройства для серверных уведомлений */
  registerPushToken(token: string): Promise<void>;

  // Встречи
  listEvents(filter: EventFilter): Promise<EventItem[]>;
  getEvent(id: ID): Promise<EventItem | null>;
  /** Подборка «Для вас»: интересы, друзья, сообщества, продвижение */
  listRecommended(cityId: CityId): Promise<EventItem[]>;
  getEventAttendees(eventId: ID): Promise<PersonRef[]>;
  /** Оплатить продвижение встречи (закреп в ленте) */
  promoteEvent(eventId: ID, payment: PaymentInput): Promise<EventItem>;
  /** Встреча организации создаётся в статусе awaiting_payment, сообщества — сразу published. */
  createEvent(input: EventInput): Promise<EventItem>;
  /** Оплата размещения встречи организацией → published. */
  payEventListing(eventId: ID, payment: PaymentInput): Promise<EventItem>;
  cancelEvent(id: ID): Promise<void>;

  // Записи
  myBookings(): Promise<BookingWithEvent[]>;
  book(eventId: ID, options?: { useSubscription?: boolean; seats?: number }): Promise<Booking>;
  getBooking(bookingId: ID): Promise<BookingWithEvent | null>;
  joinWaitlist(eventId: ID): Promise<void>;
  leaveWaitlist(eventId: ID): Promise<void>;

  // Чек-ин и кабинет организатора
  listParticipants(eventId: ID): Promise<Participant[]>;
  /** Код из QR-билета или 6 символов вручную */
  checkIn(eventId: ID, code: string): Promise<Participant & { alreadyCheckedIn: boolean }>;
  orgStats(orgId: ID): Promise<OrgStats>;

  // Отзывы
  listReviews(host: { type: 'organization' | 'community'; id: ID }): Promise<Review[]>;
  createReview(eventId: ID, rating: number, text: string): Promise<Review>;

  // Друзья
  getUserProfile(userId: ID): Promise<PublicProfile | null>;
  /** Важные (топ-5 по переписке) идут первыми */
  listFriends(): Promise<Friend[]>;
  sendFriendRequest(userId: ID): Promise<void>;
  respondFriendRequest(userId: ID, accept: boolean): Promise<void>;
  removeFriend(userId: ID): Promise<void>;

  // Чёрный список: заблокированный не пишет в личку, не шлёт заявки, не видит профиль;
  // его сообщения в чатах сообществ скрыты у заблокировавшего.
  blockUser(userId: ID): Promise<void>;
  unblockUser(userId: ID): Promise<void>;
  listBlocked(): Promise<PersonRef[]>;

  // Личные сообщения
  listConversations(): Promise<Conversation[]>;
  /** Найти или создать диалог с пользователем */
  openConversation(userId: ID): Promise<Conversation>;
  getConversation(conversationId: ID): Promise<Conversation | null>;
  listDirectMessages(conversationId: ID): Promise<DirectMessage[]>;
  sendDirectMessage(conversationId: ID, message: NewMessage): Promise<DirectMessage>;
  deleteDirectMessage(messageId: ID): Promise<void>;
  markConversationRead(conversationId: ID): Promise<void>;
  /** «Печатает…»: клиент шлёт не чаще раза в 3 с, статус живёт 5 с */
  setTyping(conversationId: ID): Promise<void>;

  // Уведомления
  listNotifications(): Promise<AppNotification[]>;
  markNotificationsRead(): Promise<void>;
  /** Оплата брони. На бэкенде — платёж Kaspi/эквайринга и подтверждение по вебхуку. */
  payBooking(bookingId: ID, payment: PaymentInput): Promise<Booking>;

  // Подписка LIFESTYLE Pass
  mySubscription(): Promise<Subscription | null>;
  subscribe(payment: PaymentInput): Promise<Subscription>;
  /** Выключает автопродление; подписка действует до конца оплаченного периода. */
  cancelSubscription(): Promise<Subscription>;
  cancelBooking(bookingId: ID): Promise<void>;

  // Организации
  myOrganizations(): Promise<Organization[]>;
  getOrganization(id: ID): Promise<Organization | null>;
  createOrganization(input: OrganizationInput): Promise<Organization>;

  // Сообщества
  listCommunities(params: { cityId: CityId; interestId?: InterestId; query?: string }): Promise<Community[]>;
  myCommunities(): Promise<Community[]>;
  getCommunity(id: ID): Promise<Community | null>;
  createCommunity(input: CommunityInput): Promise<Community>;
  joinCommunity(id: ID): Promise<void>;
  leaveCommunity(id: ID): Promise<void>;
  listPosts(communityId: ID): Promise<Post[]>;
  createPost(communityId: ID, text: string): Promise<Post>;

  // Чат сообщества
  /** Последние сообщения, новые первыми (для перевёрнутого списка). */
  listMessages(communityId: ID): Promise<ChatMessage[]>;
  sendMessage(communityId: ID, message: NewMessage): Promise<ChatMessage>;
  deleteMessage(messageId: ID): Promise<void>;
  /** Загрузка фото/голосового в хранилище. Возвращает публичный URL файла. */
  uploadMedia(file: LocalMedia): Promise<{ url: string }>;

  // Модерация
  report(target: ReportTarget, targetId: ID, reason: ReportReason): Promise<void>;
}

export type ApiErrorCode =
  | 'invalid_code'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'event_full'
  | 'payment_declined'
  | 'subscription_required'
  | 'already_reviewed'
  | 'invalid_referral'
  | 'validation'
  | 'network'
  | 'server';

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message?: string,
    readonly status?: number,
  ) {
    super(message ?? code);
  }
}

// Токен сессии держим в модуле: его выставляет AuthProvider, читают обе реализации API.
let authToken: string | null = null;
export const setAuthToken = (token: string | null) => {
  authToken = token;
};
export const getAuthToken = () => authToken;
