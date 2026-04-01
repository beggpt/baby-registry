import { chromium, Browser, Page } from 'playwright'
import { prisma } from '../utils/prisma'

const BASE_URL = 'https://www.babycenter.hr'
const SHOP_SLUG = 'babycenter'
const SHOP_NAME = 'Baby Center'

const SCRAPE_TARGETS = [
  { name: 'Kolica', slug: 'kolica', url: '/kolica/kolica', parentSlug: null },
  { name: 'Kolica kompleti', slug: 'kolica-kompleti', url: '/kolica/kolica-kompleti', parentSlug: 'kolica' },
  { name: 'Kišobran kolica', slug: 'kisobran-kolica', url: '/kolica/kisobran-kolica', parentSlug: 'kolica' },
  { name: 'Autosjedalice', slug: 'autosjedalice', url: '/autosjedalice', parentSlug: null },
  { name: 'Nosiljke', slug: 'nosiljke', url: '/nosiljke/nosiljke', parentSlug: null },
  { name: 'Marame', slug: 'marame', url: '/nosiljke/marame', parentSlug: 'nosiljke' },
  { name: 'Kreveti i vrtići', slug: 'kreveti-vrtici', url: '/kod-kuce/kreveti-i-vrtici', parentSlug: 'kod-kuce' },
  { name: 'Posteljina', slug: 'posteljina', url: '/kod-kuce/posteljina', parentSlug: 'kod-kuce' },
  { name: 'Kupanje', slug: 'kupanje', url: '/kod-kuce/kupanje', parentSlug: 'kod-kuce' },
  { name: 'Dječje sjedalice', slug: 'djecje-sjedalice', url: '/kod-kuce/djecje-sjedalice-za-hranjenje', parentSlug: 'kod-kuce' },
  { name: 'Hranjenje', slug: 'hranjenje', url: '/hranjenje-i-njega/hranjenje', parentSlug: 'hranjenje-njega' },
  { name: 'Njega i kozmetika', slug: 'njega-kozmetika', url: '/hranjenje-i-njega/njega-i-kozmetika', parentSlug: 'hranjenje-njega' },
  { name: 'Igračke za bebe', slug: 'igracke-bebe', url: '/igracke/igracke-za-bebe', parentSlug: 'igracke' },
  { name: 'Plišane igračke', slug: 'plisane-igracke', url: '/igracke/plisane-igracke', parentSlug: 'igracke' },
  { name: 'Edukativne igračke', slug: 'edukativne-igracke', url: '/igracke/edukativne-igracke', parentSlug: 'igracke' },
  { name: 'Za mame', slug: 'za-mame', url: '/za-mame', parentSlug: null },
]

const TOP_LEVEL_CATS: Record<string, string> = {
  'kolica': 'Kolica',
  'autosjedalice': 'Autosjedalice',
  'nosiljke': 'Nosiljke',
  'kod-kuce': 'Kod kuće',
  'hranjenje-njega': 'Hranjenje i njega',
  'igracke': 'Igračke',
  'za-mame': 'Za mame',
  'odjeca': 'Odjeća',
}

interface ScrapedProduct {
  name: string
  price: number
  imageUrl: string
  productUrl: string
  inStock: boolean
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

function parseHRPrice(text: string): number {
  // "1.299,99 €" → 1299.99
  const cleaned = text.replace(/[€\s\u00a0]/g, '').replace(/\./g, '').replace(',', '.')
  const val = parseFloat(cleaned)
  return isNaN(val) ? 0 : val
}

async function scrapeProducts(page: Page): Promise<ScrapedProduct[]> {
  return page.evaluate((baseUrl) => {
    const results: any[] = []

    // Baby Centar product card selectors (try multiple)
    const cardSels = [
      '.product-item', '.product-tile', '.product-card',
      '[class*="product-item"]', '[class*="product-tile"]',
      'li.item.product', '.products-grid li',
    ]

    let cards: Element[] = []
    for (const sel of cardSels) {
      const found = Array.from(document.querySelectorAll(sel))
      if (found.length > 2) { cards = found; break }
    }

    // Fallback: scrape direct product links
    if (cards.length === 0) {
      const seen = new Set<string>()
      document.querySelectorAll('a[href]').forEach(el => {
        const href = (el as HTMLAnchorElement).href
        if (!href.startsWith(baseUrl) || seen.has(href)) return
        // Baby Centar product URLs usually end with .html or contain product name
        if (!href.match(/\.(html|htm)$/) && !href.match(/\/[a-z0-9-]+-[0-9]+\/?$/)) return
        if (href.includes('/akcije') || href.includes('/login') || href.includes('/cart')) return

        const nameEl = el.querySelector('h2,h3,h4,[class*="name"],[class*="title"]')
        const name = nameEl?.textContent?.trim() || el.textContent?.trim()
        if (!name || name.length < 3 || name.length > 200) return

        const container = el.closest('li, div[class*="product"], article')
        const priceEl = container?.querySelector('[class*="price"]')
        const priceText = priceEl?.textContent?.trim() || ''
        const price = parseFloat(priceText.replace(/[€\s.]/g, '').replace(',', '.')) || 0

        const imgEl = (container || el).querySelector('img')
        const imageUrl = imgEl?.getAttribute('data-src') || imgEl?.src || ''

        seen.add(href)
        results.push({ name, price, imageUrl: imageUrl.startsWith('//') ? 'https:' + imageUrl : imageUrl, productUrl: href, inStock: true })
      })
      return results
    }

    cards.forEach(card => {
      try {
        const nameEl = card.querySelector([
          'h2', 'h3', 'h4',
          '.product-item-name', '.product-name', '.product-title',
          '[class*="product-name"]', '[class*="product-title"]',
          '[class*="item-name"]',
        ].join(','))
        const name = nameEl?.textContent?.trim()
        if (!name || name.length < 3) return

        const linkEl = card.querySelector('a[href]') as HTMLAnchorElement
        const productUrl = linkEl?.href
        if (!productUrl?.startsWith(baseUrl)) return

        const priceEl = card.querySelector([
          '.price', '.special-price .price', '.price-final_price',
          '[class*="price-final"]', '[class*="price-regular"]', '[class*="price"]',
        ].join(','))
        const priceText = priceEl?.textContent?.trim() || ''
        const price = parseFloat(
          priceText.replace(/[€\s\u00a0]/g, '').replace(/\./g, '').replace(',', '.')
        ) || 0

        const imgEl = card.querySelector('img') as HTMLImageElement
        let imageUrl = imgEl?.getAttribute('data-src') || imgEl?.getAttribute('data-lazy') || imgEl?.src || ''
        if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl

        const outOfStock = !!card.querySelector('[class*="out-of-stock"],[class*="unavailable"],[class*="sold-out"]')

        if (name && productUrl && price > 0) {
          results.push({ name, price, imageUrl, productUrl, inStock: !outOfStock })
        }
      } catch {}
    })

    return results
  }, BASE_URL)
}

async function getLastPage(page: Page): Promise<number> {
  return page.evaluate(() => {
    const sels = ['.pagination a', '.pages-items a', '[class*="pagination"] a', '[class*="pager"] a']
    let max = 1
    for (const sel of sels) {
      document.querySelectorAll(sel).forEach(el => {
        const num = parseInt(el.textContent?.trim() || '0')
        if (num > max) max = num
        const href = (el as HTMLAnchorElement).href || ''
        const m = href.match(/[?&]page=(\d+)/) || href.match(/\/p\/(\d+)/)
        if (m && parseInt(m[1]) > max) max = parseInt(m[1])
      })
      if (max > 1) break
    }
    return max
  })
}

async function upsertCategory(name: string, slug: string, parentId?: string | null) {
  return prisma.category.upsert({
    where: { slug },
    create: { name, slug, parentId: parentId ?? null },
    update: { name },
  })
}

async function upsertProduct(p: ScrapedProduct, categoryId: string) {
  const existing = await prisma.product.findFirst({ where: { productUrl: p.productUrl } })
  const data = {
    name: p.name.substring(0, 500),
    price: p.price,
    imageUrl: p.imageUrl?.substring(0, 1000) || null,
    productUrl: p.productUrl.substring(0, 1000),
    inStock: p.inStock,
    shopSlug: SHOP_SLUG,
    shopName: SHOP_NAME,
    categoryId,
    lastScraped: new Date(),
  }
  if (existing) {
    await prisma.product.update({ where: { id: existing.id }, data })
  } else {
    await prisma.product.create({ data })
  }
}

export async function runBabyCenterScraper() {
  console.log('\n🕷️  Baby Center scraper pokrenut:', new Date().toLocaleString('hr-HR'))

  await prisma.scrapedShop.upsert({
    where: { slug: SHOP_SLUG },
    create: { name: SHOP_NAME, slug: SHOP_SLUG, baseUrl: BASE_URL, isActive: true, lastStatus: 'running' },
    update: { lastStatus: 'running', lastRun: new Date(), errorMsg: null }
  })

  // Kreiraj top-level kategorije
  const parentIdMap: Record<string, string> = {}
  for (const [slug, name] of Object.entries(TOP_LEVEL_CATS)) {
    const cat = await upsertCategory(name, slug, null)
    parentIdMap[slug] = cat.id
  }

  let browser: Browser | null = null
  let totalScraped = 0
  let totalErrors = 0

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'],
    })

    const ctx = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'hr-HR',
      viewport: { width: 1440, height: 900 },
    })

    // Blokiraj reklame i trackers za brzinu
    await ctx.route(/\.(png|jpg|jpeg|gif|webp|svg|woff2?|ttf|eot)(\?.*)?$/, r => r.abort())
    await ctx.route(/(google-analytics|googletagmanager|facebook\.net|hotjar|doubleclick)/, r => r.abort())

    const page = await ctx.newPage()
    page.setDefaultTimeout(30000)

    for (const target of SCRAPE_TARGETS) {
      const parentId = target.parentSlug ? (parentIdMap[target.parentSlug] ?? null) : null
      const category = await upsertCategory(target.name, target.slug, parentId)

      console.log(`\n📂 ${target.name}`)

      try {
        await page.goto(BASE_URL + target.url, { waitUntil: 'domcontentloaded', timeout: 40000 })
        await sleep(2500)

        const totalPages = await getLastPage(page)
        const maxPages = Math.min(totalPages, 20)
        console.log(`   ${totalPages} stranica → scrapam ${maxPages}`)

        for (let pg = 1; pg <= maxPages; pg++) {
          if (pg > 1) {
            await page.goto(`${BASE_URL}${target.url}?page=${pg}`, { waitUntil: 'domcontentloaded', timeout: 40000 })
            await sleep(1800 + Math.random() * 700)
          }

          const products = await scrapeProducts(page)
          let saved = 0

          for (const p of products) {
            if (!p.name || !p.productUrl || p.price <= 0) continue
            try {
              await upsertProduct(p, category.id)
              saved++
              totalScraped++
            } catch (e) {
              totalErrors++
              if (totalErrors <= 5) console.error(`   ⚠️  ${p.name.substring(0, 40)}: ${e}`)
            }
          }

          console.log(`   Str ${pg}/${maxPages}: ${products.length} pronađeno, ${saved} spremljeno`)
          await sleep(600 + Math.random() * 400)
        }
      } catch (err) {
        console.error(`   ❌ ${target.name}: ${(err as Error).message}`)
        totalErrors++
      }

      await sleep(2000 + Math.random() * 1500)
    }

    await ctx.close()

    const finalStatus = totalScraped > 0 ? 'success' : 'error'
    await prisma.scrapedShop.update({
      where: { slug: SHOP_SLUG },
      data: {
        lastStatus: finalStatus,
        lastRun: new Date(),
        productsCount: totalScraped,
        errorMsg: totalErrors > 0 ? `${totalErrors} grešaka pri scraping` : null,
      }
    })

    console.log(`\n✅ Gotovo! ${totalScraped} proizvoda, ${totalErrors} grešaka`)
  } catch (err) {
    console.error('\n❌ Fatalna greška:', err)
    await prisma.scrapedShop.update({
      where: { slug: SHOP_SLUG },
      data: { lastStatus: 'error', errorMsg: String(err), lastRun: new Date() }
    }).catch(() => {})
  } finally {
    if (browser) await browser.close()
  }

  return { totalScraped, totalErrors }
}
