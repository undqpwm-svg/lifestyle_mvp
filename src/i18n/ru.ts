export const ru = {
  tabs: { events: 'Встречи', bookings: 'Мои записи', profile: 'Профиль' },
  common: { retry: 'Повторить', loading: 'Загрузка…', error: 'Не удалось загрузить данные', from: 'от', free: 'Бесплатно' },
  events: {
    greeting: 'Твои люди уже собираются рядом',
    all: 'Все',
    empty: 'В этой категории пока нет встреч',
    seats: 'мест',
    seatsLeft: 'Осталось мало мест',
    today: 'Сегодня',
    tomorrow: 'Завтра',
  },
  event: {
    title: 'Встреча',
    organizer: 'Организатор',
    place: 'Место',
    when: 'Когда',
    price: 'Стоимость',
    participants: 'Участники',
    book: 'Записаться через Telegram',
    booked: 'Заявка отправлена',
    full: 'Мест нет',
    notFound: 'Встреча не найдена',
    offerNote: 'Записываясь, вы принимаете условия публичной оферты.',
  },
  bookings: {
    title: 'Мои записи',
    empty: 'Вы пока никуда не записались',
    emptyHint: 'Выберите встречу в ленте — заявка появится здесь.',
    toFeed: 'К встречам',
  },
  profile: {
    title: 'Профиль',
    loginTelegram: 'Войти через Telegram',
    loginHint: 'Вход нужен, чтобы видеть записи и оплаты на всех устройствах.',
    city: 'Город',
    language: 'Язык',
    organizer: 'Стать организатором',
    community: 'Сообщество города',
    offer: 'Публичная оферта',
    privacy: 'Политика конфиденциальности',
    terms: 'Условия использования',
    version: 'Версия',
  },
  cityPicker: { title: 'Выберите город', close: 'Закрыть' },
};

// Структура словаря задаётся русской версией — остальные языки обязаны ей соответствовать.
export type Dictionary = typeof ru;
