// lib/promos.ts
export type Promo = {
  id: string
  title: string
  brand: string
  price?: string
  dates?: string
  img: string
  tag?: string
  href?: string // ustaw, jeśli ma iść na zewnętrzny URL
}

export const promos: Promo[] = [
  { id:'is', title:'Islandia – city break',      brand:'Inspiracja',   price:'od 799 PLN', img:'/promos/flag_is.png', tag:'Loty' },
  { id:'es', title:'Barcelona – kiedy lecieć?',  brand:'Inspiracja',                       img:'/promos/flag_es.png', tag:'Poradnik' },
  { id:'us', title:'Pierwszy wyjazd do USA',     brand:'Praktyczne rady',                  img:'/promos/flag_us.png', tag:'Praktyczne porady' },
  { id:'no', title:'Oslo budżetowo',             brand:'Inspiracja',                       img:'/promos/flag_no.png', tag:'Loty' },
  { id:'hu', title:'Budapeszt 36h – plan',       brand:'City Break',                       img:'/promos/flag_hu.png', tag:'Przewodnik' },
  { id:'pl', title:'Tanie loty z Polski',        brand:'Inspiracja',                       img:'/promos/flag_pl.png', tag:'Loty' },
]

// pomocnicze:
export const getPromo = (id: string) => promos.find(p => p.id === id) || null
export const promoPath = (id: string) => `/promo/${id}`
