'use client'

import Image from 'next/image'
import { Instagram, Facebook, Youtube } from 'lucide-react'
import { SiTiktok } from 'react-icons/si'
import { motion } from 'framer-motion'

export default function ContactSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-24 text-center flex flex-col items-center gap-10">
      {/* Nagłówek */}
      <motion.h2
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-4xl md:text-5xl font-extrabold text-neutral-900 dark:text-white"
      >
        Skontaktuj się ze&nbsp;mną
      </motion.h2>

      {/* Opis */}
      <motion.p
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        viewport={{ once: true }}
        className="text-lg text-neutral-700 dark:text-gray-300 max-w-2xl"
      >
        Jeśli masz pytania, chcesz nawiązać współpracę albo po prostu pogadać o&nbsp;podróżach —
        odezwij się! Najłatwiej złapać mnie przez social media 👇
      </motion.p>

      {/* Ikony */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="flex flex-wrap justify-center gap-6 text-xl"
      >
        <a
          href="https://www.instagram.com/zwiedzajchytrze/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="rounded-full bg-white/10 hover:bg-white/20 p-3 transition-all hover:scale-110 shadow"
        >
          <Instagram className="w-6 h-6 text-pink-500 dark:text-pink-400" />
        </a>
        <a
          href="https://www.tiktok.com/@zwiedzajchytrze"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="TikTok"
          className="rounded-full bg-white/10 hover:bg-white/20 p-3 transition-all hover:scale-110 shadow"
        >
          <SiTiktok className="w-6 h-6 text-black dark:text-white" />
        </a>
        <a
          href="https://www.youtube.com/@zwiedzajchytrze"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="YouTube"
          className="rounded-full bg-white/10 hover:bg-white/20 p-3 transition-all hover:scale-110 shadow"
        >
          <Youtube className="w-6 h-6 text-red-600 dark:text-red-500" />
        </a>
        <a
          href="https://www.facebook.com/profile.php?id=61578581730371"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className="rounded-full bg-white/10 hover:bg-white/20 p-3 transition-all hover:scale-110 shadow"
        >
          <Facebook className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </a>
      </motion.div>

      {/* Przycisk email */}
      <motion.a
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        viewport={{ once: true }}
        href="mailto:kontakt@zwiedzajchytrze.pl"
        className="inline-block px-6 py-3 mt-2 font-medium rounded-xl shadow hover:scale-105 transition text-white"
        style={{ backgroundColor: '#f1861e' }}
      >
        Napisz maila&nbsp;✉️
      </motion.a>

      {/* Zdjęcie */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        viewport={{ once: true }}
        className="relative w-full max-w-md rounded-2xl shadow-xl overflow-hidden ring-1 ring-white/10"
      >
        <Image
          src="/contact.JPG"
          alt="Rafał z&nbsp;plecakiem"
          width={800}
          height={1066}
          className="w-full h-auto object-cover contrast-105 saturate-110"
          priority
        />
      </motion.div>
    </section>
  )
}
