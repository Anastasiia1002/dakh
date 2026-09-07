export type DateRange = { from: string; to: string }

export type Stay = {
  slug: string
  name: string
  kicker: string
  summary: string
  description: string
  priceFrom: number
  area: number
  guests: number
  extraKids: boolean
  rooms: number
  amenities: { label: string; icon: AmenityIcon }[]
  images: string[]
  blocked: DateRange[]
}

export type AmenityIcon = 'breakfast' | 'linen' | 'bath' | 'window' | 'quiet' | 'garden'

export type MenuCategory = 'zakusky' | 'pershi' | 'osnovni' | 'deserty' | 'napoi'

export type Dish = {
  slug: string
  category: MenuCategory
  name: string
  lead: string
  ingredients: string
  price: number
  image: string
}

const photo = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

export const site = {
  name: 'DAKH',
  city: 'Чернівці',
  region: 'Буковина',
  address: 'вул. Ольги Кобилянської, 18, Чернівці',
  phones: ['+38 (095) 320-20-20'],
  phoneHref: 'tel:+380953202020',
  email: 'hello@dakh.ua',
  instagram: 'https://instagram.com/',
  checkIn: '15:00',
  checkOut: '12:00',
}

export const images = {
  heroHouse: photo('photo-1449158743715-0a90ebb6d2d8', 2000),
  pottery: photo('photo-1610701596007-11502861dcfa', 1400),
  borscht: photo('photo-1490645935967-10de6ba17061', 1800),
  dining: photo('photo-1559339352-11d035aa65de', 2000),
  chef: photo('photo-1556910103-1c02745aae4d', 1400),
  restaurantDark: photo('photo-1517248135467-4c7edcad34c4', 2000),
  interior: photo('photo-1414235077428-338989a2e8c0', 1400),
  cocktail: photo('photo-1470337458703-46ad1756a187', 1200),
  forest: photo('photo-1441974231531-c6227db76b6e', 1400),
  linenBed: photo('photo-1505693416388-ac5ce068fe85', 1600),
}

export const stays: Stay[] = [
  {
    slug: 'bukovyna',
    name: 'Кімната Буковина',
    kicker: 'На двох',
    summary: 'Світло з вікна на подвір’я, лляна постіль, тиша за товстою стіною.',
    description:
      'Кімната дивиться у двір старого будинку. Тут мало речей — ліжко, дерево, кераміка на підвіконні. Ранок починається повільно: сніданок унизу, потім місто за рогом.',
    priceFrom: 4800,
    area: 28,
    guests: 2,
    extraKids: false,
    rooms: 1,
    amenities: [
      { label: 'Сніданок включено', icon: 'breakfast' },
      { label: 'Лляна постіль', icon: 'linen' },
      { label: 'Ванна з душем', icon: 'bath' },
      { label: 'Вікно у двір', icon: 'window' },
    ],
    images: [
      photo('photo-1505693416388-ac5ce068fe85'),
      photo('photo-1631049307264-da0ec9d70304'),
      photo('photo-1552321554-5fefe8c9ef14'),
      photo('photo-1441974231531-c6227db76b6e'),
      photo('photo-1565193566173-7a0ee3dbe261'),
    ],
    blocked: [{ from: '2026-09-12', to: '2026-09-15' }],
  },
  {
    slug: 'goryshche',
    name: 'Горище DAKH',
    kicker: 'Під дахом',
    summary: 'Схил стелі, балка і вікно в небо — місце, де хочеться читати до вечора.',
    description:
      'Горище лишили майже таким, яким воно було: нахил, дерево, тиша. З вікна видно дахи Чернівців. На двох, якщо вмієте ділити плед.',
    priceFrom: 6200,
    area: 34,
    guests: 2,
    extraKids: false,
    rooms: 1,
    amenities: [
      { label: 'Сніданок включено', icon: 'breakfast' },
      { label: 'Вид на дахи', icon: 'window' },
      { label: 'Тиша ввечері', icon: 'quiet' },
      { label: 'Ванна з душем', icon: 'bath' },
    ],
    images: [
      photo('photo-1611892440504-42a792e24d32'),
      photo('photo-1600585154340-be6161a56a0c'),
      photo('photo-1552321554-5fefe8c9ef14'),
      photo('photo-1449158743715-0a90ebb6d2d8'),
      photo('photo-1464822759023-fed622ff2c3b'),
    ],
    blocked: [],
  },
  {
    slug: 'plats',
    name: 'Садиба Пляц',
    kicker: 'Для родини',
    summary: 'Дві кімнати, окремий вхід із саду — коли хочеться жити своїм ритмом.',
    description:
      'Пляц — невелика садиба у дворі. Дві кімнати, свій поріг, стіл під горіхом. Зручно, якщо їдете вчотирьох і не хочете збиратися в коридорі.',
    priceFrom: 9200,
    area: 56,
    guests: 4,
    extraKids: true,
    rooms: 2,
    amenities: [
      { label: 'Сніданок включено', icon: 'breakfast' },
      { label: 'Вхід із саду', icon: 'garden' },
      { label: 'Дві кімнати', icon: 'linen' },
      { label: 'Тиша ввечері', icon: 'quiet' },
    ],
    images: [
      photo('photo-1470770841072-f978cf4d019e'),
      photo('photo-1600585154340-be6161a56a0c'),
      photo('photo-1631049307264-da0ec9d70304'),
      photo('photo-1565193566173-7a0ee3dbe261'),
      photo('photo-1441974231531-c6227db76b6e'),
    ],
    blocked: [{ from: '2026-09-20', to: '2026-09-23' }],
  },
]

export const menuCategories: { id: MenuCategory; label: string }[] = [
  { id: 'zakusky', label: 'Закуски' },
  { id: 'pershi', label: 'Перші страви' },
  { id: 'osnovni', label: 'Основні' },
  { id: 'deserty', label: 'Десерти' },
  { id: 'napoi', label: 'Напої' },
]

export const dishes: Dish[] = [
  {
    slug: 'brynza-med',
    category: 'zakusky',
    name: 'Бринза з медом і горіхами',
    lead: 'Солоне масло полонини і липовий мед.',
    ingredients: 'Буковинська бринза, липовий мед, волоський горіх, житній хліб на заквасці.',
    price: 280,
    image: photo('photo-1482049016688-2d3e1b311543', 1200),
  },
  {
    slug: 'pampushky',
    category: 'zakusky',
    name: 'Пампушки з часником і кропом',
    lead: 'Теплі, щоб розламати руками.',
    ingredients: 'Пшеничне тісто, часник, кріп, топлене масло.',
    price: 160,
    image: photo('photo-1509440159596-0249088772ff', 1200),
  },
  {
    slug: 'forel-zakuska',
    category: 'zakusky',
    name: 'Копчена форель із хріном',
    lead: 'Річка поруч, хрін із городу.',
    ingredients: 'Форель холодного копчення, хрін, сметана, огірок, кріп.',
    price: 340,
    image: photo('photo-1519708227418-c8fd9a32b7a2', 1200),
  },
  {
    slug: 'borshch',
    category: 'pershi',
    name: 'Борщ на квасолі',
    lead: 'Темний, з часником і пампушкою збоку.',
    ingredients: 'Буряк, квасоля, яловичина, пастернак, часник, сметана.',
    price: 290,
    image: photo('photo-1490645935967-10de6ba17061', 1200),
  },
  {
    slug: 'banush',
    category: 'pershi',
    name: 'Бануш із бринзою',
    lead: 'Кукурудзяна каша, як на полонині — тільки тихіше.',
    ingredients: 'Кукурудзяна крупа, вершки, бринза, шкварки, кріп.',
    price: 310,
    image: photo('photo-1546069901-ba9599a7e63c', 1200),
  },
  {
    slug: 'forel-gryby',
    category: 'osnovni',
    name: 'Форель з білими грибами',
    lead: 'Перший подих карпатських лугів на тарілці.',
    ingredients: 'Форель, білі гриби, вершкове масло, чебрець, печена картопля.',
    price: 520,
    image: photo('photo-1519708227418-c8fd9a32b7a2', 1200),
  },
  {
    slug: 'telyatyna',
    category: 'osnovni',
    name: 'Телятина з печеними овочами',
    lead: 'Довге тепло печі, а не гриль «для ефекту».',
    ingredients: 'Телятина, морква, пастернак, розмарин, сік ягід калини.',
    price: 580,
    image: photo('photo-1504674900247-0877df9cc836', 1200),
  },
  {
    slug: 'varenyky',
    category: 'osnovni',
    name: 'Вареники з картоплею і шкварками',
    lead: 'Тонке тісто, багато начинки, сметана окремо.',
    ingredients: 'Тісто, картопля, цибуля, шкварки, сметана.',
    price: 270,
    image: photo('photo-1473093295043-cdd812d0e601', 1200),
  },
  {
    slug: 'napoleon',
    category: 'deserty',
    name: 'Наполеон на сметані',
    lead: 'Листи хрусткі, крем несолодкий.',
    ingredients: 'Листкове тісто, сметанний крем, ваніль, цукрова пудра.',
    price: 220,
    image: photo('photo-1551024506-0bccd828d307', 1200),
  },
  {
    slug: 'syrnyk',
    category: 'deserty',
    name: 'Сирник із вишнею',
    lead: 'Кисла вишня тримає солодке на місці.',
    ingredients: 'Домашній сир, яйце, вишня, мед.',
    price: 210,
    image: photo('photo-1563805042-7684c019e1cb', 1200),
  },
  {
    slug: 'uzvar',
    category: 'napoi',
    name: 'Узвар з груш і калини',
    lead: 'Теплий, трохи кислий, без сиропу.',
    ingredients: 'Сушені груші, калина, яблуко, мед.',
    price: 90,
    image: photo('photo-1551218808-94e220e084d2', 1200),
  },
  {
    slug: 'nastoyanka',
    category: 'napoi',
    name: 'Настоянка на глоді',
    lead: 'Ковток після вечері, не коктейль «для сторіс».',
    ingredients: 'Глід, мед, місцева настоянка, цедра.',
    price: 160,
    image: photo('photo-1470337458703-46ad1756a187', 1200),
  },
]

export const featuredDishes = ['borshch', 'forel-gryby', 'napoleon']
  .map((slug) => dishes.find((dish) => dish.slug === slug))
  .filter((dish): dish is Dish => Boolean(dish))

export function stayBySlug(slug: string) {
  return stays.find((stay) => stay.slug === slug)
}

export function dishBySlug(slug: string) {
  return dishes.find((dish) => dish.slug === slug)
}
