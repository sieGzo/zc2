import Image from 'next/image'
import { Globe, Map, Flag } from 'lucide-react'

export default function AboutSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-12 items-center text-center">
      {/* Tekst */}
      <div className="space-y-8 text-base leading-relaxed text-neutral-800 dark:text-gray-300 flex flex-col items-center">
        <h2 className="text-4xl font-extrabold mb-6" style={{ color: '#f1861e' }}>
          Cześć! Mam na imię Rafał
        </h2>

        {/* Blok 1 */}
        <div className="flex flex-col items-center gap-4 max-w-prose">
          <Globe className="w-16 h-16 text-yellow-600" />
          <span>
            Odwiedziłem już <span className="text-yellow-600 font-semibold">13% świata</span>,
            czyli <strong>26&nbsp;z&nbsp;195 krajów</strong>. Byłem na <strong>4&nbsp;z&nbsp;7 kontynentów</strong> – w&nbsp;tym ponad miesiąc
            spędziłem na&nbsp;trzech z&nbsp;nich, a&nbsp;dwa tygodnie w&nbsp;Afryce. Uwielbiam odkrywać mniej znane miejsca, planować tanie loty i&nbsp;podróże poza sezonem.
          </span>
        </div>

        {/* Blok 2 */}
        <div className="flex flex-col items-center gap-4 max-w-prose">
          <Map className="text-blue-600 dark:text-blue-400 w-16 h-16" />
          <span>
            Zwiedzam <strong className="text-blue-600 dark:text-blue-400">budżetowo</strong>,
            szukam okazji podróżniczych, promocji lotniczych i&nbsp;noclegów w&nbsp;dobrych cenach. Podróżowanie nie musi być drogie — wystarczy trochę sprytu i&nbsp;dobrego planu.
            Na tej stronie dzielę się sprawdzonymi patentami na tanie podróżowanie, tworzeniem tras, aplikacjami turystycznymi i&nbsp;praktycznymi listami do&nbsp;spakowania.
          </span>
        </div>

        {/* Blok 3 */}
        <div className="flex flex-col items-center gap-4 max-w-prose">
          <Flag className="text-green-600 dark:text-green-400 w-16 h-16" />
          <span>
            Mam na koncie <strong className="text-green-600 dark:text-green-400">45&nbsp;z&nbsp;50 stanów USA</strong>.
            Podróże po Ameryce nauczyły mnie, jak z&nbsp;mapą i&nbsp;plecakiem można naprawdę dużo zobaczyć, nie wydając fortuny. Fotografuję, testuję narzędzia do&nbsp;planowania tras i&nbsp;notuję wskazówki, które mogą się przydać innym miłośnikom podróży.
          </span>
        </div>

        {/* Call to action */}
        <div className="pt-6 text-sm text-gray-600 dark:text-gray-400 italic">
          Chcesz podróżować sprytniej i&nbsp;więcej widzieć za mniej? Dołącz do mnie na blogu lub social mediach!
        </div>
      </div>

      {/* Zdjęcie */}
      <div className="relative w-full max-w-md mx-auto rounded-2xl shadow-xl overflow-hidden">
        <Image
          src="/explore.jpg"
          alt="Rafał w USA"
          width={800}
          height={1066}
          className="w-full h-auto object-cover contrast-105 saturate-110"
          priority
        />
      </div>
    </section>
  )
}
