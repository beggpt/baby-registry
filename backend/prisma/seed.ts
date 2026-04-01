import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding baze podataka...')

  // Kreiraj zapis za Baby Center shop
  await prisma.scrapedShop.upsert({
    where: { slug: 'babycenter' },
    create: {
      name: 'Baby Center',
      slug: 'babycenter',
      baseUrl: 'https://www.babycenter.hr',
      isActive: true,
    },
    update: {}
  })

  console.log('✅ Seed završen!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
