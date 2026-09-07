import { Photo } from '../components/Photo'
import { images, site } from '../data/catalog'

export function AboutPage() {
  return (
    <article className="mx-auto max-w-6xl px-6 pb-24 pt-32">
      <p className="text-[0.7rem] tracking-[0.18em] uppercase text-clay">Про нас</p>
      <h1 className="mt-3 max-w-2xl font-display text-5xl leading-tight">Місце, де тиша має звук</h1>
      <p className="mt-8 max-w-2xl leading-relaxed text-wood/80">
        DAKH зібрано з того, що вже було в будинку: товсті стіни, дерев’яні сходи, двір із горіхом.
        Ми не перебудовували Чернівці під готель — лишили будинок жити своїм темпом і відкрили
        кілька кімнат і кухню для тих, хто вміє бути повільно.
      </p>

      <div className="mt-16 grid gap-4 md:grid-cols-2">
        <Photo src={images.heroHouse} alt="Двір і дах" className="aspect-[4/3] w-full" />
        <Photo src={images.forest} alt="Світло між деревами" className="aspect-[4/3] w-full" />
      </div>

      <section className="mt-20 grid gap-16 md:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl">Буковина в тарілці</h2>
          <p className="mt-4 text-sm leading-relaxed text-wood/75">
            Ресторан працює як частина дому, не як окрема сцена. Меню коротке, продукти — з
            області. Стіл не бронюємо на сайті: зателефонуйте або зайдіть, як зайдете.
          </p>
        </div>
        <div>
          <h2 className="font-display text-3xl">{site.city}</h2>
          <p className="mt-4 text-sm leading-relaxed text-wood/75">
            Старе місто близько, але за вікном — свій двір. Якщо треба карта з пінами всіх
            «локацій» — це не сюди. Якщо треба дах на ніч і вечеря — так.
          </p>
        </div>
      </section>
    </article>
  )
}
