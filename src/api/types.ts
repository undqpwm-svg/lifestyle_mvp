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
  createdAt: ISODate;
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
  /** Ссылка на чат в Telegram — переписка в MVP живёт там */
  telegramUrl?: string;
  coverUrl?: string;
  /** Роль текущего пользователя; null — не участник */
  myRole: CommunityRole | null;
  createdAt: ISODate;
};

export type CommunityInput = Pick<Community, 'name' | 'description' | 'cityId' | 'interests' | 'telegramUrl'>;

export type Post = {
  id: ID;
  communityId: ID;
  authorId: ID;
  authorName: string;
  text: string;
  createdAt: ISODate;
};

// Встреча
export type HostType = 'organization' | 'community';

/** Кто проводит встречу. Денормализовано для ленты, чтобы не делать N запросов. */
export type HostRef = { type: HostType; id: ID; name: string; verified: boolean };

export type EventStatus = 'published' | 'cancelled';

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
  startsAt: ISODate;
  durationMin: number;
  /** Цена в тенге, целое. 0 — бесплатно. Платно — только у verified-организаций. */
  priceKzt: number;
  capacity: number;
  bookedCount: number;
  status: EventStatus;
  createdBy: ID;
  /** Бронь текущего пользователя, если есть */
  myBooking: Booking | null;
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
};

export type EventFilter = { cityId: CityId; interestId?: InterestId; hostType?: HostType; hostId?: ID };

// Запись на встречу
/** pending_payment — место удерживается до оплаты; confirmed — участник */
export type BookingStatus = 'pending_payment' | 'confirmed' | 'cancelled';

export type Booking = {
  id: ID;
  eventId: ID;
  userId: ID;
  status: BookingStatus;
  createdAt: ISODate;
};

export type BookingWithEvent = Booking & { event: EventItem };

// Модерация
export type ReportTarget = 'event' | 'community' | 'post' | 'organization' | 'user';
export type ReportReason = 'spam' | 'fraud' | 'offensive' | 'other';

// Авторизация
export type AuthResult = { token: string; user: User; isNew: boolean };

/** Профиль считается заполненным, когда есть имя и хотя бы один интерес. */
export function isProfileComplete(user: User): boolean {
  return user.name.trim().length > 0 && user.interests.length > 0;
}
