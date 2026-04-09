import axios from 'axios'
import * as cheerio from 'cheerio'
import { prisma } from '../utils/prisma'

const BASE_URL = 'https://www.svijet-beba.hr'
const SHOP_SLUG = 'svijetbeba'
const SHOP_NAME = 'Svijet Beba'

// Mapiranje svijet-beba kategorija u naše interne kategorije
// Format: { naziv, url path za scraping, parentSlug (naša kategorija), slug (naš slug) }
const SCRAPE_TARGETS = [
  // Kolica
  { name: 'Kolica - kompleti', url: '/djecja-kolica-za-bebe-kisobran-kolica-i-kolica-za-dvoje/42/69/1', parentSlug: 'kolica', slug: 'kolica-kompleti' },
  { name: 'Kišobran kolica', url: '/42/69/117', parentSlug: 'kolica', slug: 'kisobran-kolica' },

  // Autosjedalice
  { name: 'Autosjedalice', url: '/autosjedalice-za-bebe-i-djecje-autosjedalice/42/66/1', parentSlug: 'autosjedalice', slug: 'autosjedalice' },

  // Hranjenje
  { name: 'Bočice', url: '/hranjenje/kljunasice/42/61/179', parentSlug: 'hranjenje-njega', slug: 'hranjenje' },
  { name: 'Posude za hranu', url: '/hranjenje/posude/42/61/181', parentSlug: 'hranjenje-njega', slug: 'hranjenje' },
  { name: 'Dude varalice', url: '/hranjenje/dude-varalice/42/61/183', parentSlug: 'hranjenje-njega', slug: 'hranjenje' },
  { name: 'Grizala', url: '/hranjenje/grizala/42/61/184', parentSlug: 'hranjenje-njega', slug: 'hranjenje' },
  { name: 'Pribor za jelo', url: '/hranjenje/hranjenje-bebe/42/61/188', parentSlug: 'hranjenje-njega', slug: 'hranjenje' },
  { name: 'Dojenje', url: '/hranjenje/dojenje/42/61/189', parentSlug: 'hranjenje-njega', slug: 'hranjenje' },
  { name: 'Hranilice', url: '/hranjenje/hranilice-za-bebe/42/61/190', parentSlug: 'hranjenje-njega', slug: 'djecje-sjedalice' },

  // Kupanje i njega
  { name: 'Kozmetika', url: '/kupanje-i-higijena-kadice-kozmetika-previjanje-kozmetika/42/56/342', parentSlug: 'hranjenje-njega', slug: 'njega-kozmetika' },
  { name: 'Kupanje', url: '/kupanje-i-higijena-kadice-kozmetika-previjanje-djecje-kadice/42/56/343', parentSlug: 'kod-kuce', slug: 'kupanje' },
  { name: 'Previjanje', url: '/kupanje-i-higijena-kadice-kozmetika-previjanje-previjanje/42/56/346', parentSlug: 'hranjenje-njega', slug: 'njega-kozmetika' },

  // Dječja soba
  { name: 'Namještaj', url: '/djecja-soba-krevetici-kolijevke-za-bebe-i-putni-krevetici/42/58/303', parentSlug: 'kod-kuce', slug: 'kreveti-vrtici' },
  { name: 'Baby monitori', url: '/djecja-soba-baby-monitor/42/58/307', parentSlug: 'kod-kuce', slug: 'kreveti-vrtici' },
  { name: 'Dodaci za krevetiće', url: '/djecja-soba-spavanje/42/58/308', parentSlug: 'kod-kuce', slug: 'posteljina' },
  { name: 'Tekstil sobica', url: '/djecja-soba-dekice/42/58/309', parentSlug: 'kod-kuce', slug: 'posteljina' },
  { name: 'Njihaljke i gnijezda', url: '/djecja-soba-njihaljke/42/58/318', parentSlug: 'kod-kuce', slug: 'kreveti-vrtici' },

  // Nosiljke (iz "Izvan kuće")
  { name: 'Nosiljke', url: '/izvan-kuce-nosenje-bebe/42/38/463', parentSlug: 'nosiljke', slug: 'nosiljke' },

  // Igračke
  { name: 'Igračke za bebe', url: '/igracke-za-bebe/42/15/480', parentSlug: 'igracke', slug: 'igracke-bebe' },
  { name: 'Plišane igračke', url: '/igracke-plisanci/42/15/479', parentSlug: 'igracke', slug: 'plisane-igracke' },
  { name: 'Edukativne igračke', url: '/igracke-edukativne/42/15/477', parentSlug: 'igracke', slug: 'edukativne-igracke' },
  { name: 'Didaktičke igračke', url: '/igracke-didakticke/42/15/476', parentSlug: 'igracke', slug: 'edukativne-igracke' },
  { name: 'Kreativne igračke', url: '/igracke-kreativne/42/15/481', parentSlug: 'igracke', slug: 'edukativne-igracke' },
  { name: 'Na kotačima', url: '/igracke-na-kotacima/42/15/472', parentSlug: 'igracke', slug: 'igracke-bebe' },
  { name: 'Društvene igre', url: '/igracke-drustvene-igre/42/15/553', parentSlug: 'igracke', slug: 'edukativne-igracke' },
  { name: 'Knjige i slikovnice', url: '/igracke-slikovnice/42/15/716', parentSlug: 'igracke', slug: 'edukativne-igracke' },

  // Za mame
  { name: 'Za mame', url: '/za-mame-njega-dojenje-i-organizacija/42/112/1', parentSlug: 'za-mame', slug: 'za-mame' },

  // Moda/Odjeća
  { name: 'Moda', url: '/moda/42/62/1', parentSlug: 'odjeca', slug: 'odjeca' },
]

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

  // Svijet Beba uses article.product for product cards
  $('article.product').each((_, el) => {
    try {
      const $el = $(el)

      // Link and name
      const $link = $el.find('a[href^="/"]').first()
      let productUrl = $link.attr('href') || ''
      if (!productUrl) return
      if (productUrl.startsWith('/')) productUrl = BASE_URL + productUrl
      if (seen.has(productUrl)) return
      seen.add(productUrl)

      const $title = $el.find('h2').first()
      const name = $title.text().trim() || $link.text().trim()
      if (!name || name.length < 3) return

      // Price
      const $price = $el.find('.price').first()
      const price = parseHRPrice($price.text())

      // Image
      const $img = $el.find('img').first()
      let imageUrl = $img.attr('data-src') || $img.attr('src') || ''
      if (imageUrl.startsWith('/')) imageUrl = BASE_URL + imageUrl
      if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl

      // Out of stock check
      const outOfStock = $el.find('[class*="out-of-stock"], [class*="sold-out"], [class*="unavailable"]').length > 0

      if (name && productUrl && price > 0) {
        results.push({ name, price, imageUrl, productUrl, inStock: !outOfStock })
      }
    } catch {}
  })

  // Fallback: try generic product-like links if no article.product found
  if (results.length === 0) {
    $('a[href*="/41/"]').each((_, el) => {
      try {
        const $el = $(el)
        let href = $el.attr('href') || ''
        if (href.startsWith('/')) href = BASE_URL + href
        if (seen.has(href)) return

        const name = $el.find('h2, h3').text().trim() || $el.text().trim()
        if (!name || name.length < 3 || name.length > 300) return

        const container = $el.closest('article, div, li')
        const priceText = container.find('.price, [class*="price"]').text()
        const price = parseHRPrice(priceText)

        const $img = container.find('img').first()
        let imageUrl = $img.attr('data-src') || $img.attr('src') || ''
        if (imageUrl.startsWith('/')) imageUrl = BASE_URL + imageUrl

        seen.add(href)
        if (price > 0) {
          results.push({ name: name.substring(0, 300), price, imageUrl, productUrl: href, inStock: true })
        }
      } catch {}
    })
  }

  return results
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

export async function runSvijetBebaScraper() {
  console.log('\n🕷️  Svijet Beba scraper pokrenut:', new Date().toLocaleString('hr-HR'))

  await prisma.scrapedShop.upsert({
    where: { slug: SHOP_SLUG },
    create: { name: SHOP_NAME, slug: SHOP_SLUG, baseUrl: BASE_URL, isActive: true, lastStatus: 'running' },
    update: { lastStatus: 'running', lastRun: new Date(), errorMsg: null }
  })

  let totalScraped = 0
  let totalErrors = 0

  try {
    for (const target of SCRAPE_TARGETS) {
      // Find category by slug
      const category = await prisma.category.findUnique({ where: { slug: target.slug } })
      if (!category) {
        console.log(`   ⚠️  Kategorija "${target.slug}" ne postoji, preskačem ${target.name}`)
        continue
      }

      console.log(`\n📂 ${target.name} → ${target.slug}`)

      try {
        const $ = await fetchPage(BASE_URL + target.url)
        if (!$) { totalErrors++; continue }

        const products = scrapeProducts($)
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

        console.log(`   ${products.length} pronađeno, ${saved} spremljeno`)
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

    console.log(`\n✅ Svijet Beba gotovo! ${totalScraped} proizvoda, ${totalErrors} grešaka`)
  } catch (err) {
    console.error('\n❌ Fatalna greška:', err)
    await prisma.scrapedShop.update({
      where: { slug: SHOP_SLUG },
      data: { lastStatus: 'error', errorMsg: String(err), lastRun: new Date() }
    }).catch(() => {})
  }

  return { totalScraped, totalErrors }
}
