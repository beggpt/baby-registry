import { Metadata } from 'next'
import PublicListClient from './PublicListClient'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/public/lista/${params.slug}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return { title: 'Lista nije pronađena — Bebina Lista' }

    const list = await res.json()
    const totalCount = list.items?.length || 0
    const reservedCount = list.items?.filter((i: any) => i.reservation).length || 0
    const availableCount = totalCount - reservedCount
    const mamaName = list.user?.name || 'novu mamu'

    const title = `${list.name} — Bebina Lista`
    const description = `Baby lista za ${mamaName} — ${totalCount} poklona, ${availableCount} slobodno. Pogledaj što je na listi i rezerviraj poklon!`

    // Use the first item's image as OG image, or fallback
    const ogImage = list.items?.[0]?.product?.imageUrl || undefined

    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || 'https://bebinalista.hr'
    const listUrl = `${frontendUrl}/lista/${params.slug}`

    return {
      title,
      description,
      openGraph: {
        title: list.name,
        description,
        siteName: 'Bebina Lista',
        type: 'website',
        url: listUrl,
        ...(ogImage && { images: [{ url: ogImage, width: 600, height: 600, alt: list.name }] }),
      },
      twitter: {
        card: ogImage ? 'summary_large_image' : 'summary',
        title: list.name,
        description,
        ...(ogImage && { images: [ogImage] }),
      },
      other: {
        'og:locale': 'hr_HR',
      },
    }
  } catch {
    return {
      title: 'Bebina Lista — Baby wish lista za nove roditelje',
      description: 'Pogledaj baby listu i rezerviraj poklon!',
    }
  }
}

export default function Page({ params }: { params: { slug: string } }) {
  return <PublicListClient slug={params.slug} />
}
