export type StayKind = 'room' | 'townhouse'

export type DateRange = { from: string; to: string }

export type Stay = {
  slug: string
  kind: StayKind
  name: string
  kicker: string
  summary: string
  description: string
  priceFrom: number
  area: number
  guests: number
  extraKids: boolean
  rooms: number
  bathrooms: number
  floors: number
  breakfast: boolean
  parking: boolean
  terrace: boolean
  kitchen: boolean
  amenities: string[]
  spaces: { title: string; items: string[] }[]
  images: string[]
  blocked: DateRange[]
}

const photo = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

export const site = {
  name: 'Sunny Park',
  place: 'Мигове',
  region: 'Чернівецька область',
  address: 'вул. Солонецька, Мигове',
  phones: ['+38 (095) 818-00-01', '+38 (096) 818-00-01'],
  phoneHref: 'tel:+380958180001',
  email: 'sunny@sunnypark.com.ua',
  instagram: 'https://www.instagram.com/',
  checkIn: '14:00',
  checkOut: '11:00',
  hectares: 2,
  mapEmbed:
    'https://www.openstreetmap.org/export/embed.html?bbox=25.33%2C48.13%2C25.43%2C48.18&layer=mapnik&marker=48.152%2C25.378',
}

export const images = {
  hero: photo('photo-1464822759023-fed622ff2c3b', 2000),
  forest: photo('photo-1441974231531-c6227db76b6e', 1600),
  cabin: photo('photo-1449158743715-0a90ebb6d2d8', 1600),
  lodge: photo('photo-1520250497591-112f2f40a3f4', 1600),
  pool: photo('photo-1576013551627-0cc20b96c2a7', 1600),
  spa: photo('photo-1540555700478-4be289fbecef', 1600),
  sauna: photo('photo-1600334129128-685c5582fd35', 1600),
  restaurant: photo('photo-1414235077428-338989a2e8c0', 1600),
  terrace: photo('photo-1559339352-11d035aa65de', 1600),
  breakfast: photo('photo-1495214783159-3503fd1b572d', 1400),
  house: photo('photo-1518780664697-55e3ad937233', 1600),
  peaks: photo('photo-1506905925346-21bda4d32df4', 1800),
}

const roomSleep = [
  'Двоспальне ліжко',
  'Приліжкові тумби',
  'Шафа',
  'Телевізор',
  'Кондиціонер',
]
const bath = [
  'Душова кабіна',
  'Фен',
  'Готельна косметика',
  'Халати й тапочки',
  'Рушники',
]
const kitchen = [
  'Індукційна плита',
  'Великий холодильник',
  'Кавова машина',
  'Мікрохвильова піч',
  'Посуд і чайник',
]

export const stays: Stay[] = [
  {
    slug: 'odnokimnatnyi',
    kind: 'room',
    name: 'Однокімнатний номер',
    kicker: 'Для двох',
    summary: 'Світла кімната з балконом — для пари або самостійної поїздки в гори.',
    description:
      'Тихе місце після дороги: теплі тони дерева, власний санвузол і балкон із видом на територію. Підходить, якщо хочеться мінімуму метушні й близького доступу до SPA.',
    priceFrom: 3500,
    area: 25,
    guests: 2,
    extraKids: false,
    rooms: 1,
    bathrooms: 1,
    floors: 1,
    breakfast: true,
    parking: true,
    terrace: true,
    kitchen: false,
    amenities: ['Балкон', 'Кондиціонер', 'Телевізор', 'Холодильник', 'Сніданок'],
    spaces: [
      { title: 'Спальня', items: roomSleep },
      { title: 'Ванна', items: bath },
      { title: 'Зовні', items: ['Балкон', 'Вид на територію', 'Паркінг'] },
    ],
    images: [
      photo('photo-1611892440504-42a792e24d32'),
      photo('photo-1566665797739-1674de7a421a'),
      photo('photo-1552321554-5fefe8c9ef14'),
    ],
    blocked: [{ from: '2026-09-12', to: '2026-09-15' }],
  },
  {
    slug: 'dvokimnatnyi',
    kind: 'room',
    name: 'Двокімнатний з терасою',
    kicker: 'Родина або друзі',
    summary: 'Дві кімнати й тераса — більше повітря, якщо їдете вчотирьох.',
    description:
      'Окрема спальня й зона денного відпочинку, щоб хтось міг рано встати на ліс, а хтось — ще спати. Тераса тримає ранок: кава, хвойне повітря, вид на схили.',
    priceFrom: 5000,
    area: 40,
    guests: 4,
    extraKids: false,
    rooms: 2,
    bathrooms: 1,
    floors: 1,
    breakfast: true,
    parking: true,
    terrace: true,
    kitchen: false,
    amenities: ['Тераса', 'Кондиціонер', 'Телевізор', 'Холодильник', 'Сніданок'],
    spaces: [
      { title: 'Спальня', items: roomSleep },
      { title: 'Ванна', items: bath },
      { title: 'Зовні', items: ['Тераса', 'Мангал поруч', 'Дитячий майданчик'] },
    ],
    images: [
      photo('photo-1631049307264-da0ec9d70304'),
      photo('photo-1600585154340-be6161a56a0c'),
      photo('photo-1552321554-5fefe8c9ef14'),
    ],
    blocked: [{ from: '2026-09-20', to: '2026-09-23' }],
  },
  {
    slug: 'taunkhaus-3',
    kind: 'townhouse',
    name: 'Таунхаус на 3 спальні',
    kicker: 'Дім на шістьох',
    summary: 'Окремий вхід, кухня й тераса — компанія живе своїм ритмом.',
    description:
      'Двоповерховий будинок для великої родини або друзів. Спільна кухня, кілька спалень і своя тераса: можна вечеряти вдома або спуститися в LA Terrace.',
    priceFrom: 10000,
    area: 100,
    guests: 6,
    extraKids: false,
    rooms: 3,
    bathrooms: 2,
    floors: 2,
    breakfast: true,
    parking: true,
    terrace: true,
    kitchen: true,
    amenities: ['Кухня', 'Тераса', 'Окремий вхід', 'Паркінг', 'Сніданок'],
    spaces: [
      { title: 'Спальні', items: roomSleep },
      { title: 'Кухня', items: kitchen },
      { title: 'Ванні', items: bath },
      { title: 'Зовні', items: ['Тераса', 'Мангал', 'Паркінг біля будинку'] },
    ],
    images: [
      photo('photo-1518780664697-55e3ad937233'),
      photo('photo-1556912173-46c336c7fd55'),
      photo('photo-1600585154340-be6161a56a0c'),
    ],
    blocked: [],
  },
  {
    slug: 'taunkhaus-2-dytiacha',
    kind: 'townhouse',
    name: 'Таунхаус 2 спальні + дитяча',
    kicker: 'З дітьми',
    summary: 'Окрема кімната для дітей — батьки відпочивають спокійніше.',
    description:
      'Компактний двоповерховий таунхаус для сім’ї: дві дорослі спальні й дитяча. Кухня й тераса на місці; сніданок можна додати окремо.',
    priceFrom: 8000,
    area: 100,
    guests: 4,
    extraKids: true,
    rooms: 3,
    bathrooms: 2,
    floors: 2,
    breakfast: false,
    parking: true,
    terrace: true,
    kitchen: true,
    amenities: ['Дитяча кімната', 'Кухня', 'Тераса', 'Паркінг'],
    spaces: [
      { title: 'Спальні', items: [...roomSleep, 'Окрема дитяча'] },
      { title: 'Кухня', items: kitchen },
      { title: 'Зовні', items: ['Тераса', 'Дитячий майданчик', 'Паркінг'] },
    ],
    images: [
      photo('photo-1520250497591-112f2f40a3f4'),
      photo('photo-1611892440504-42a792e24d32'),
      photo('photo-1441974231531-c6227db76b6e'),
    ],
    blocked: [{ from: '2026-09-05', to: '2026-09-08' }],
  },
  {
    slug: 'taunkhaus-4',
    kind: 'townhouse',
    name: 'Таунхаус на 4 спальні',
    kicker: 'Компанія до 8',
    summary: 'Чотири спальні, кухня й кілька ванних — майже як свій дім у горах.',
    description:
      'Для великої компанії, якій потрібен простір і незалежність: окремий вхід, повна кухня, кілька санвузлів. Сніданки входять у тариф.',
    priceFrom: 12000,
    area: 150,
    guests: 8,
    extraKids: false,
    rooms: 4,
    bathrooms: 3,
    floors: 2,
    breakfast: true,
    parking: true,
    terrace: true,
    kitchen: true,
    amenities: ['4 спальні', 'Кухня', 'Кілька ванних', 'Тераса', 'Сніданок'],
    spaces: [
      { title: 'Спальні', items: roomSleep },
      { title: 'Кухня', items: kitchen },
      { title: 'Ванні', items: ['Ванна при спальнях', ...bath] },
      { title: 'Зовні', items: ['Балкони й тераса', 'Мангал', 'Паркінг'] },
    ],
    images: [
      photo('photo-1470770841072-f978cf4d019e'),
      photo('photo-1631049307264-da0ec9d70304'),
      photo('photo-1556912173-46c336c7fd55'),
    ],
    blocked: [{ from: '2026-09-18', to: '2026-09-21' }],
  },
  {
    slug: 'taunkhaus-4-dytiacha',
    kind: 'townhouse',
    name: 'Таунхаус 4 спальні + дитяча',
    kicker: 'Велика родина',
    summary: 'П’ять кімнат для дорослих і дітей — ніхто не ділить диван.',
    description:
      'Найзручніший варіант для родини з дітьми різного віку: чотири спальні плюс дитяча, своя кухня й територія біля будинку.',
    priceFrom: 12000,
    area: 150,
    guests: 8,
    extraKids: true,
    rooms: 5,
    bathrooms: 3,
    floors: 2,
    breakfast: true,
    parking: true,
    terrace: true,
    kitchen: true,
    amenities: ['Дитяча кімната', '5 кімнат', 'Кухня', 'Тераса', 'Сніданок'],
    spaces: [
      { title: 'Спальні', items: [...roomSleep, 'Дитяча кімната'] },
      { title: 'Кухня', items: kitchen },
      { title: 'Зовні', items: ['Тераса', 'Майданчик', 'Паркінг'] },
    ],
    images: [
      photo('photo-1501785888041-af3ef285b470'),
      photo('photo-1600585154340-be6161a56a0c'),
      photo('photo-1611892440504-42a792e24d32'),
    ],
    blocked: [],
  },
  {
    slug: 'premium',
    kind: 'townhouse',
    name: 'Таунхаус Преміум',
    kicker: 'Окремий будинок',
    summary: 'Окрема будівля на території: максимум тиші й приватності.',
    description:
      'Преміум стоїть окремо від ряду таунхаусів. Чотири спальні, ванна при кожній, велика кухня й тераса. Для гостей, яким важлива дистанція й деталі.',
    priceFrom: 14000,
    area: 150,
    guests: 8,
    extraKids: true,
    rooms: 4,
    bathrooms: 4,
    floors: 2,
    breakfast: true,
    parking: true,
    terrace: true,
    kitchen: true,
    amenities: ['Окремий будинок', '4 ванні', 'Велика кухня', 'Тераса', 'Сніданок'],
    spaces: [
      { title: 'Спальні', items: roomSleep },
      { title: 'Кухня', items: [...kitchen, 'Великий стіл'] },
      { title: 'Ванні', items: ['Ванна в кожній спальні', ...bath] },
      { title: 'Зовні', items: ['Тераса', 'Вид на гори', 'Паркінг'] },
    ],
    images: [
      photo('photo-1542314831-068cd1dbfeeb'),
      photo('photo-1556912173-46c336c7fd55'),
      photo('photo-1576013551627-0cc20b96c2a7'),
    ],
    blocked: [{ from: '2026-09-08', to: '2026-09-11' }],
  },
]

export const spaFacilities = [
  {
    title: 'Закритий басейн 10×15',
    text: 'Тепла вода щодня, незалежно від карпатської погоди.',
  },
  {
    title: 'Відкритий басейн',
    text: 'Літній контур просто неба — після прогулянки в ліс.',
  },
  {
    title: 'Дитячий басейн',
    text: 'Неглибока чаша з м’якою температурою для найменших.',
  },
  {
    title: 'Фінська сауна',
    text: 'Сухе високе тепло після лижні чи довгої дороги.',
  },
  {
    title: 'Фіто-сауна',
    text: 'М’якше тепло з трав’яними настоями.',
  },
  {
    title: 'Хамам',
    text: 'Волога пара близько 45 °C — без різкого контрасту.',
  },
  {
    title: 'Соляна кімната',
    text: 'Короткі сесії для дихання й паузи від міста.',
  },
]

export const spaPrices = {
  residents: [
    { when: 'Пн–Чт', adult: 550, child: 350 },
    { when: 'Пт–Нд', adult: 650, child: 350 },
  ],
  visitors: [
    { when: '10:00–13:00', adult: 600, child: 350 },
    { when: '14:00–17:00', adult: 650, child: 400 },
    { when: '18:00–21:00', adult: 700, child: 450 },
  ],
  notes: [
    'Діти до 3 років — безкоштовно.',
    'УБД — знижка 10% за посвідченням.',
    'У вартість: басейни, сауни, халат і рушник.',
    'Технічні перерви: 13:00–14:00 та 17:00–18:00.',
  ],
}

export const menuHighlights = [
  { course: 'На початок', dish: 'Буряковий крем із хріном і сметаною', note: 'Сезонний' },
  { course: 'З гір', dish: 'Бануш із бринзою та шкварками', note: 'Буковина' },
  { course: 'М’ясо', dish: 'Телятина на відкритому вогні, печені овочі', note: 'На двох' },
  { course: 'Риба', dish: 'Форель із лісовими травами', note: 'День у день' },
  { course: 'Паста', dish: 'Домашня локшина з грибами', note: 'Осінь' },
  { course: 'Солодке', dish: 'Наполеон із сметанним кремом', note: 'Класика' },
]

export const faqs = [
  {
    q: 'Який час заїзду та виїзду?',
    a: `Заїзд з ${site.checkIn}, виїзд до ${site.checkOut}. Раніше чи пізніше — за наявності місця, узгоджуємо на рецепції.`,
  },
  {
    q: 'Чи можна з тваринами?',
    a: 'Так, маленьких тварин приймаємо після попереднього узгодження.',
  },
  {
    q: 'Чи є паркінг?',
    a: 'Так, охороняний паркінг для гостей комплексу безкоштовний.',
  },
  {
    q: 'Як бронювати?',
    a: 'Оберіть дати на сайті або зателефонуйте. Підтвердження надходить на пошту чи в месенджер. Цей прототип зберігає заявку локально — без оплати онлайн.',
  },
]

export function stayBySlug(slug: string) {
  return stays.find((stay) => stay.slug === slug)
}
