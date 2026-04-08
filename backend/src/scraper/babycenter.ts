import axios from 'axios'
import * as cheerio from 'cheerio'
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

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

function parseHRPrice(text: string): number {
  const cleaned = text.replace(/[€\s\u00a0]/g, '').replace(/\./g, '').replace(',', '.')
  const val = parseFloat(cleaned)
  return isNaN(val) ? 0 : val
}

async function fetchPage(url: string): Promise<cheerio.CheerioAPI | null> {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'hr-HR,hr;q=0.9,en;q=0.8',
      },
      timeout: 30000,
    })
    return cheerio.load(data)
  } catch (err) {
    console.error(`   Fetch error: ${url} — ${(err as Error).message}`)
    return null
  }
}

function scrapeProducts($: cheerio.CheerioAPI): ScrapedProduct[] {
  const results: ScrapedProduct[] = []
  const seen = new Set<string>()

  // Try common product card selectors
  const cardSelectors = [
    '.product-item',
    '.product-tile',
    '.product-card',
    '[class*="product-item"]',
    '[class*="product-tile"]',
    'li.item.product',
    '.products-grid li',
  ]

  let $cards = $('')
  for (const sel of cardSelectors) {
    const found = $(sel)
    if (found.length > 2) { $cards = found; break }
  }

  if ($cards.length > 0) {
    $cards.each((_, card) => {
      try {
        const $card = $(card)

        // Name
        const nameEl = $card.find('h2, h3, h4, .product-item-name, .product-name, .product-title, [class*="product-name"], [class*="product-title"], [class*="item-name"]').first()
        const name = nameEl.text().trim()
        if (!name || name.length < 3) return

        // URL
        const linkEl = $card.find('a[href]').first()
        let productUrl = linkEl.attr('href') || ''
        if (productUrl.startsWith('/')) productUrl = BASE_URL + productUrl
        if (!productUrl.startsWith(BASE_URL)) return
        if (seen.has(productUrl)) return
        seen.add(productUrl)

        // Price
        const priceEl = $card.find('.price, .special-price .price, .price-final_price, [class*="price-final"], [class*="price-regular"], [class*="price"]').first()
        const price = parseHRPrice(priceEl.text())

        // Image
        const imgEl = $card.find('img').first()
        let imageUrl = imgEl.attr('data-src') || imgEl.attr('data-lazy') || imgEl.attr('src') || ''
        if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl

        // Stock
        const outOfStock = $card.find('[class*="out-of-stock"], [class*="unavailable"], [class*="sold-out"]').length > 0

        if (name && productUrl && price > 0) {
          results.push({ name, price, imageUrl, productUrl, inStock: !outOfStock })
        }
      } catch {}
    })
  }

  // Fallback: scrape product links directly
  if (results.length === 0) {
    $('a[href]').each((_, el) => {
      const $el = $(el)
      let href = $el.attr('href') || ''
      if (href.startsWith('/')) href = BASE_URL + href
      if (!href.startsWith(BASE_URL) || seen.has(href)) return
      if (!href.match(/\.(html|htm)$/) && !href.match(/\/[a-z0-9-]+-[0-9]+\/?$/)) return
      if (href.includes('/akcije') || href.includes('/login') || href.includes('/cart')) return

      const container = $el.closest('li, div[class*="product"], article')
      const nameEl = $el.find('h2, h3, h4, [class*="name"], [class*="title"]').first()
      const name = nameEl.text().trim() || $el.text().trim()
      if (!name || name.length < 3 || name.length > 200) return

      const priceEl = container.find('[class*="price"]').first()
      const price = parseHRPrice(priceEl.text())

      const imgEl = container.find('img').first()
      let imageUrl = imgEl.attr('data-src') || imgEl.attr('src') || ''
      if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl

      seen.add(href)
      results.push({ name, price, imageUrl, productUrl: href, inStock: true })
    })
  }

  return results
}

function getLastPage($: cheerio.CheerioAPI): number {
  let max = 1
  const paginationSels = ['.pagination a', '.pages-items a', '[class*="pagination"] a', '[class*="pager"] a']
  for (const sel of paginationSels) {
    $(sel).each((_, el) => {
      const num = parseInt($(el).text().trim() || '0')
      if (num > max) max = num
      const href = $(el).attr('href') || ''
      const m = href.match(/[?&]page=(\d+)/) || href.match(/\/p\/(\d+)/)
      if (m && parseInt(m[1]) > max) max = parseInt(m[1])
    })
    if (max > 1) break
  }
  return max
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

  let totalScraped = 0
  let totalErrors = 0

  try {
    for (const target of SCRAPE_TARGETS) {
      const parentId = target.parentSlug ? (parentIdMap[target.parentSlug] ?? null) : null
      const category = await upsertCategory(target.name, target.slug, parentId)

      console.log(`\n📂 ${target.name}`)

      try {
        const $ = await fetchPage(BASE_URL + target.url)
        if (!$) { totalErrors++; continue }

        const totalPages = getLastPage($)
        const maxPages = Math.min(totalPages, 20)
        console.log(`   ${totalPages} stranica → scrapam ${maxPages}`)

        // First page
        const firstProducts = scrapeProducts($)
        let saved = 0
        for (const p of firstProducts) {
          if (!p.name || !p.productUrl || p.price <= 0) continue
          try { await upsertProduct(p, category.id); saved++; totalScraped++ }
          catch (e) { totalErrors++; if (totalErrors <= 5) console.error(`   ⚠️  ${p.name.substring(0, 40)}: ${e}`) }
        }
        console.log(`   Str 1/${maxPages}: ${firstProducts.length} pronađeno, ${saved} spremljeno`)

        // Remaining pages
        for (let pg = 2; pg <= maxPages; pg++) {
          await sleep(1800 + Math.random() * 700)

          const $page = await fetchPage(`${BASE_URL}${target.url}?page=${pg}`)
          if (!$page) continue

          const products = scrapeProducts($page)
          saved = 0
          for (const p of products) {
            if (!p.name || !p.productUrl || p.price <= 0) continue
            try { await upsertProduct(p, category.id); saved++; totalScraped++ }
            catch (e) { totalErrors++; if (totalErrors <= 5) console.error(`   ⚠️  ${p.name.substring(0, 40)}: ${e}`) }
          }
          console.log(`   Str ${pg}/${maxPages}: ${products.length} pronađeno, ${saved} spremljeno`)
        }
      } catch (err) {
        console.error(`   ❌ ${target.name}: ${(err as Error).message}`)
        totalErrors++
      }

      await sleep(2000 + Math.random() * 1500)
    }

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
  }

  return { totalScraped, totalErrors }
}
