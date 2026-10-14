import type {
  AuthResult,
  Booking,
  BookingWithEvent,
  ChatMessage,
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
  Post,
  ProfileInput,
  ReportReason,
  ReportTarget,
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

  // Встречи
  listEvents(filter: EventFilter): Promise<EventItem[]>;
  getEvent(id: ID): Promise<EventItem | null>;
  createEvent(input: EventInput): Promise<EventItem>;
  cancelEvent(id: ID): Promise<void>;

  // Записи
  myBookings(): Promise<BookingWithEvent[]>;
  book(eventId: ID): Promise<Booking>;
  /** Оплата брони. На бэкенде — создание платежа Kaspi и ожидание вебхука. */
  payBooking(bookingId: ID): Promise<Booking>;
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
