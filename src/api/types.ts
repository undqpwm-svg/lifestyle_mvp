// Доменная модель LIFESTYLE. Это контракт между мобильным клиентом и бэкендом:
// при изменении синхронизировать с docs/ARCHITECTURE.md и API сервера.
import type { CityId } from '@/config/cities';

export type ID = string;
/** ISO 8601 с часовым поясом */
export type ISODate = string;

export type InterestId =
  | 'volleyball'
  | 'football'
  | 'basketball'
  | 'tennis'
  | 'running'
  | 'boardgames'
  | 'mafia'
  | 'cooking'
  | 'workshops'
  | 'walks'
  | 'music'
  | 'tech';

// Пользователь
export type User = {
  id: ID;
  phone: string;
  name: string;
  cityId: CityId;
  interests: InterestId[];
  /** Личный промокод для приглашения друзей */
  referralCode: string;
  /** Бонусный баланс в тенге (реферальная программа) */
  bonusKzt: number;
  createdAt: ISODate;
};

export type GeoPoint = { lat: number; lng: number };

/** Средняя оценка встреч организатора по отзывам участников */
export type HostRating = { avg: number; count: number };

// Друзья и публичный профиль
export type FriendshipStatus = 'self' | 'none' | 'outgoing' | 'incoming' | 'friends';

export type PersonRef = { id: ID; name: string };

export type PublicProfile = {
  id: ID;
  name: string;
  cityId: CityId;
  interests: InterestId[];
  friendship: FriendshipStatus;
  /** Я заблокировал этого пользователя */
  blocked: boolean;
  attendedCount: number;
  friendsCount: number;
  communities: { id: ID; name: string }[];
  /** «Где был» — только друзьям (приватность); остальным null */
  recentEvents: { id: ID; title: string; startsAt: ISODate }[] | null;
};

export type ProfileInput = Pick<User, 'name' | 'cityId' | 'interests'>;

// Организация (кафе, клуб, спорткомплекс, студия)
export type OrgType = 'cafe' | 'sports' | 'club' | 'studio' | 'other';

/** pending — на модерации; verified — проверена, можно продавать билеты */
export type OrgStatus = 'pending' | 'verified' | 'rejected';

export type Organization = {
  id: ID;
  name: string;
  type: OrgType;
  cityId: CityId;
  address: string;
  description: string;
  /** БИН (ТОО) или ИИН (ИП) — 12 цифр */
  bin: string;
  status: OrgStatus;
  coverUrl?: string;
  location: GeoPoint;
  rating: HostRating | null;
  ownerId: ID;
  createdAt: ISODate;
};

export type OrganizationInput = Pick<Organization, 'name' | 'type' | 'cityId' | 'address' | 'description' | 'bin'>;

// Сообщество по интересам
export type CommunityRole = 'owner' | 'moderator' | 'member';

export type Community = {
  id: ID;
  name: string;
  description: string;
  cityId: CityId;
  interests: InterestId[];
  ownerId: ID;
  membersCount: number;
  coverUrl?: string;
  rating: HostRating | null;
  /** Роль текущего пользователя; null — не участник */
  myRole: CommunityRole | null;
  createdAt: ISODate;
};

export type CommunityInput = Pick<Community, 'name' | 'description' | 'cityId' | 'interests'>;

/** Объявление в сообществе — пишут только владелец и модераторы. */
export type Post = {
  id: ID;
  communityId: ID;
  authorId: ID;
  authorName: string;
  text: string;
  createdAt: ISODate;
};

// Чат сообщества (как группа в мессенджере: только для участников)
export type ImageAttachment = { kind: 'image'; url: string; width: number; height: number };
export type VoiceAttachment = { kind: 'voice'; url: string; durationMs: number };
/** Встреча, которой поделились в личных сообщениях */
export type EventAttachment = { kind: 'event'; eventId: ID; title: string; startsAt: ISODate; venue: string; coverUrl?: string };
export type Attachment = ImageAttachment | VoiceAttachment | EventAttachment;

export type ChatMessage = {
  id: ID;
  communityId: ID;
  authorId: ID;
  authorName: string;
  text: string;
  attachments: Attachment[];
  createdAt: ISODate;
  /** Только на клиенте: сообщение ещё отправляется */
  pending?: boolean;
};

export type NewMessage = { text: string; attachments: Attachment[] };

/** Общее для сообщений в чате сообщества и в личке — то, что рисует пузырь сообщения. */
export type MessageView = Pick<ChatMessage, 'id' | 'authorId' | 'authorName' | 'text' | 'attachments' | 'createdAt' | 'pending'>;

// Личные сообщения: диалог 1-на-1, писать можно и друзьям, и не друзьям
export type DirectMessage = Omit<ChatMessage, 'communityId'> & { conversationId: ID };

export type Conversation = {
  id: ID;
  peer: PersonRef;
  isFriend: boolean;
  /** false — один из собеседников заблокировал другого */
  canMessage: boolean;
  /** Я заблокировал собеседника (можно разблокировать) */
  blockedByMe: boolean;
  lastMessage: { text: string; authorId: ID; createdAt: ISODate; kind: 'text' | 'image' | 'voice' | 'event' } | null;
  unread: number;
  updatedAt: ISODate;
};

/** Друг; important — топ-5 по переписке за 30 дней («Важные», как в «Поделиться» в Instagram) */
export type Friend = PersonRef & { important: boolean; messages30d: number };

/** Локальный файл с устройства, который нужно загрузить в хранилище перед отправкой. */
export type LocalMedia = { uri: string; kind: 'image' | 'voice'; mimeType?: string };

// Встреча
export type HostType = 'organization' | 'community';

/** Кто проводит встречу. Денормализовано для ленты, чтобы не делать N запросов. */
export type HostRef = { type: HostType; id: ID; name: string; verified: boolean };

/** awaiting_payment — организация создала встречу, но не оплатила размещение (видна только автору) */
export type EventStatus = 'awaiting_payment' | 'published' | 'cancelled';

export type EventItem = {
  id: ID;
  cityId: CityId;
  interestId: InterestId;
  title: string;
  description: string;
  /** Фото встречи; если нет — клиент показывает обложку по категории */
  coverUrl?: string;
  host: HostRef;
  venue: string;
  address: string;
  location: GeoPoint;
  startsAt: ISODate;
  durationMin: number;
  /** Цена в тенге, целое. 0 — бесплатно. Платно — только у verified-организаций. */
  priceKzt: number;
  capacity: number;
  bookedCount: number;
  /** Подписчики LIFESTYLE Pass ходят бесплатно (только платные встречи проверенных организаций) */
  includedInSubscription: boolean;
  /** Оплачено продвижение: закреп в ленте до этой даты */
  promotedUntil?: ISODate;
  status: EventStatus;
  createdBy: ID;
  /** Бронь текущего пользователя, если есть */
  myBooking: Booking | null;
  /** Место в листе ожидания (1 — первый), null — не в очереди */
  myWaitlistPosition: number | null;
  /** Друзья, которые идут */
  friendsGoing: PersonRef[];
};

export type EventInput = {
  host: { type: HostType; id: ID };
  interestId: InterestId;
  title: string;
  description: string;
  venue: string;
  address: string;
  startsAt: ISODate;
  durationMin: number;
  priceKzt: number;
  capacity: number;
  includedInSubscription: boolean;
};

export type EventFilter = { cityId: CityId; interestId?: InterestId; hostType?: HostType; hostId?: ID };

// Запись на встречу
/** pending_payment — место удерживается до оплаты; confirmed — участник;
 *  cancelled_late — отмена записи по подписке позже срока: место освобождено, посещение списано */
export type BookingStatus = 'pending_payment' | 'confirmed' | 'cancelled' | 'cancelled_late';

export type Booking = {
  id: ID;
  eventId: ID;
  userId: ID;
  status: BookingStatus;
  /** Запись по подписке — без оплаты, списывает одно посещение */
  viaSubscription: boolean;
  /** Мест в брони: себе и друзьям одним платежом */
  seats: number;
  /** Код билета для чек-ина (также зашит в QR) */
  code: string;
  checkedInAt?: ISODate;
  createdAt: ISODate;
};

export type BookingWithEvent = Booking & { event: EventItem; canReview: boolean; myReview: Review | null };

// Отзывы
export type Review = {
  id: ID;
  eventId: ID;
  eventTitle: string;
  host: { type: HostType; id: ID };
  userId: ID;
  userName: string;
  /** 1–5 */
  rating: number;
  text: string;
  createdAt: ISODate;
};

// Кабинет организатора
export type Participant = {
  bookingId: ID;
  userId: ID;
  name: string;
  phoneMasked: string;
  seats: number;
  status: BookingStatus;
  viaSubscription: boolean;
  checkedInAt?: ISODate;
  paidKzt: number;
};

export type OrgEventStats = {
  id: ID;
  title: string;
  startsAt: ISODate;
  status: EventStatus;
  seats: number;
  capacity: number;
  checkedIn: number;
  revenueKzt: number;
  passVisits: number;
  payoutKzt: number;
};

export type OrgStats = {
  totals: { seats: number; checkedIn: number; revenueKzt: number; passVisits: number; payoutKzt: number; events: number };
  events: OrgEventStats[];
};

// Уведомления: текст собирает клиент по type + params на языке пользователя
export type NotificationType =
  | 'welcome'
  | 'booking_confirmed'
  | 'reminder'
  | 'waitlist_offer'
  | 'chat_message'
  | 'review_request'
  | 'friend_request'
  | 'friend_accepted'
  | 'new_event'
  | 'referral_bonus'
  | 'direct_message';

export type AppNotification = {
  id: ID;
  type: NotificationType;
  params: Record<string, string>;
  /** Куда ведёт уведомление (путь Expo Router) */
  link?: { pathname: string; params?: Record<string, string> };
  createdAt: ISODate;
  readAt?: ISODate;
};

// Платежи
export type PaymentMethod = 'kaspi' | 'card';

/** Данные карты есть только в демо. В продакшене карту вводят в форме эквайера, сюда приходит токен. */
export type CardInput = { number: string; expMonth: number; expYear: number; cvc: string };

/** useBonus — списать бонусы (не больше BONUS_MAX_SHARE от суммы) */
export type PaymentInput = ({ method: 'kaspi' } | { method: 'card'; card: CardInput }) & { useBonus?: boolean };

export type PaymentPurpose = 'booking' | 'subscription' | 'listing' | 'promotion';

export type Payment = {
  id: ID;
  purpose: PaymentPurpose;
  amountKzt: number;
  /** Сколько оплачено бонусами (входит в amountKzt) */
  bonusKzt: number;
  method: PaymentMethod;
  status: 'succeeded' | 'failed';
  createdAt: ISODate;
};

// Подписка
export type Subscription = {
  id: ID;
  planId: string;
  /** active — действует до endsAt; cancelled — автопродление выключено, но период ещё идёт */
  status: 'active' | 'cancelled' | 'expired';
  startedAt: ISODate;
  endsAt: ISODate;
  visitsUsed: number;
  visitsLimit: number;
};

// Модерация
export type ReportTarget = 'event' | 'community' | 'post' | 'message' | 'organization' | 'user';
export type ReportReason = 'spam' | 'fraud' | 'offensive' | 'other';

// Авторизация
export type AuthResult = { token: string; user: User; isNew: boolean };

/** Профиль считается заполненным, когда есть имя и хотя бы один интерес. */
export function isProfileComplete(user: User): boolean {
  return user.name.trim().length > 0 && user.interests.length > 0;
}
