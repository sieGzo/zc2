// scripts/backfill-iphash.js
const crypto = require('crypto')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function ipHmac(ip) {
  const secret = process.env.VISIT_HASH_SECRET || 'CHANGE_ME'
  return crypto.createHmac('sha256', secret).update(ip || '').digest('hex').slice(0, 64)
}

async function main() {
  const rows = await prisma.visit.findMany({
    where: { ipHash: null },
    select: { id: true, ip: true },
  })
  console.log(`Do zapełnienia: ${rows.length}`)

  for (const r of rows) {
    await prisma.visit.update({
      where: { id: r.id },
      data: { ipHash: ipHmac(r.ip || '') },
    })
  }
  console.log('Gotowe.')
}

main().finally(() => prisma.$disconnect())
