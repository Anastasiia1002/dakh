# DAKH frontend

Сайт комплексу DAKH у Чернівцях: готель, ресторан, художнє меню. Заявки на кімнату пишуться в `localStorage` (`dakh-bookings`). Стіл у ресторані на сайті не бронюється.

## Запуск

```bash
npm install
npm run dev
```

Відкрийте http://127.0.0.1:5173/

## Сторінки

- `/` — головна
- `/gotel`, `/gotel/:slug` — кімнати
- `/restoran`, `/menu` — ресторан і меню з модалкою страви
- `/pro-nas`, `/kontakty`
- `/bronuvannya` — бронювання кімнати (localStorage)

Hajdamaka — комерційний шрифт. Покладіть ліцензійний `public/fonts/Hajdamaka.woff2`, доти заголовки йдуть Cormorant Garamond. У текстах немає слова «преміум».
