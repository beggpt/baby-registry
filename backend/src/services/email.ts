import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@bebinalista.hr'
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

interface ReservationEmailParams {
  mamaEmail: string
  mamaName: string
  listName: string
  listSlug: string
  productName: string
  productPrice: number
  productCurrency: string
  reservedBy: string
  reservedNote?: string
}

interface WelcomeEmailParams {
  email: string
  name: string
}

// Email mami kad netko rezervira poklon
export async function sendReservationEmail(params: ReservationEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.log('⚠️  RESEND_API_KEY nije postavljen - email neće biti poslan')
    return
  }

  const formattedPrice = new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: params.productCurrency || 'EUR',
  }).format(params.productPrice)

  const listUrl = `${APP_URL}/lista/${params.listSlug}`

  const html = `
<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Netko je rezervirao poklon!</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #F2D9D0;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#F2D9D0 0%,#FAF7F2 100%);padding:40px 40px 32px;text-align:center;">
      <p style="font-size:48px;margin:0 0 16px;">🎁</p>
      <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#2C2320;margin:0 0 8px;">
        Netko je rezervirao poklon!
      </h1>
      <p style="color:#6B6360;font-size:15px;margin:0;">
        Vijest sa tvoje liste <strong>${params.listName}</strong>
      </p>
    </div>

    <!-- Content -->
    <div style="padding:32px 40px;">
      <p style="color:#2C2320;font-size:16px;margin:0 0 24px;">
        Hej <strong>${params.mamaName}</strong>! 💕
      </p>
      
      <p style="color:#6B6360;font-size:15px;margin:0 0 24px;line-height:1.6;">
        <strong style="color:#C97B6B;">${params.reservedBy}</strong> upravo je rezervirao/la poklon s tvoje liste!
      </p>

      <!-- Product box -->
      <div style="background:#FAF7F2;border-radius:16px;padding:20px;margin:0 0 24px;border:1px solid #F2D9D0;">
        <p style="font-size:13px;color:#6B6360;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em;">Rezervirani proizvod</p>
        <p style="font-size:16px;font-weight:500;color:#2C2320;margin:0 0 6px;">${params.productName}</p>
        <p style="font-size:18px;color:#C97B6B;font-weight:500;margin:0;">${formattedPrice}</p>
      </div>

      ${params.reservedNote ? `
      <!-- Note from friend -->
      <div style="background:#F0F3EE;border-radius:16px;padding:20px;margin:0 0 24px;border-left:3px solid #8BA888;">
        <p style="font-size:13px;color:#6B6360;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em;">Poruka</p>
        <p style="font-size:15px;color:#2C2320;margin:0;font-style:italic;">"${params.reservedNote}"</p>
      </div>
      ` : ''}

      <p style="color:#6B6360;font-size:15px;margin:0 0 28px;line-height:1.6;">
        Pogledaj tko je što rezervirao na tvojoj listi 👇
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:0 0 32px;">
        <a href="${listUrl}" 
           style="display:inline-block;background:#C97B6B;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:15px;font-weight:500;">
          Pogledaj svoju listu
        </a>
      </div>

      <hr style="border:none;border-top:1px solid #F2D9D0;margin:0 0 24px;">

      <p style="color:#9B9490;font-size:13px;margin:0;text-align:center;line-height:1.6;">
        Ovo je automatska obavijest s <a href="${APP_URL}" style="color:#C97B6B;text-decoration:none;">Bebine Liste</a>.<br>
        Napravljeno s ljubavlju 💕
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()

  try {
    const result = await resend.emails.send({
      from: `Bebina Lista <${FROM_EMAIL}>`,
      to: params.mamaEmail,
      subject: `🎁 ${params.reservedBy} rezervira poklon za tvoju bebu!`,
      html,
    })
    console.log('✉️  Email poslan:', result.data?.id)
    return result
  } catch (err) {
    console.error('❌ Email greška:', err)
  }
}

// Email mami kad se netko pridruži grupnoj kupovini
interface GroupBuyJoinEmailParams {
  mamaEmail: string
  mamaName: string
  listName: string
  listSlug: string
  productName: string
  contributorName: string
  contributorAmount: number
  contributorCurrency: string
  totalCollected: number
  targetAmount: number
  contributorsCount: number
}

export async function sendGroupBuyJoinEmail(params: GroupBuyJoinEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY nije postavljen - email nece biti poslan')
    return
  }

  const formattedAmount = new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: params.contributorCurrency || 'EUR',
  }).format(params.contributorAmount)

  const formattedTotal = new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: params.contributorCurrency || 'EUR',
  }).format(params.totalCollected)

  const formattedTarget = new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: params.contributorCurrency || 'EUR',
  }).format(params.targetAmount)

  const progressPercent = Math.min(100, Math.round((params.totalCollected / params.targetAmount) * 100))
  const listUrl = `${APP_URL}/lista/${params.listSlug}`

  const html = `
<!DOCTYPE html>
<html lang="hr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #F2D9D0;">
    <div style="background:linear-gradient(135deg,#F2D9D0 0%,#FAF7F2 100%);padding:40px 40px 32px;text-align:center;">
      <p style="font-size:48px;margin:0 0 16px;">&#x1F465;</p>
      <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#2C2320;margin:0 0 8px;">
        Netko se pridruzio grupnoj kupovini!
      </h1>
      <p style="color:#6B6360;font-size:15px;margin:0;">
        Vijest sa tvoje liste <strong>${params.listName}</strong>
      </p>
    </div>
    <div style="padding:32px 40px;">
      <p style="color:#2C2320;font-size:16px;margin:0 0 24px;">
        Hej <strong>${params.mamaName}</strong>!
      </p>
      <p style="color:#6B6360;font-size:15px;margin:0 0 24px;line-height:1.6;">
        <strong style="color:#C97B6B;">${params.contributorName}</strong> se pridruzio/la grupnoj kupovini za <strong>${params.productName}</strong> (${formattedAmount})
      </p>
      <div style="background:#FAF7F2;border-radius:16px;padding:20px;margin:0 0 24px;border:1px solid #F2D9D0;">
        <p style="font-size:13px;color:#6B6360;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.05em;">Napredak grupne kupovine</p>
        <p style="font-size:18px;color:#C97B6B;font-weight:500;margin:0 0 8px;">${formattedTotal} / ${formattedTarget} (${params.contributorsCount} osoba)</p>
        <div style="background:#F2D9D0;border-radius:8px;height:8px;overflow:hidden;">
          <div style="background:linear-gradient(90deg,#C9A96E,#D4B87A);height:100%;width:${progressPercent}%;border-radius:8px;"></div>
        </div>
        ${progressPercent >= 100 ? '<p style="font-size:14px;color:#8BA888;margin:8px 0 0;font-weight:500;">&#x1F389; Cilj je dostignut!</p>' : ''}
      </div>
      <div style="text-align:center;margin:0 0 32px;">
        <a href="${listUrl}" style="display:inline-block;background:#C97B6B;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:15px;font-weight:500;">
          Pogledaj svoju listu
        </a>
      </div>
      <hr style="border:none;border-top:1px solid #F2D9D0;margin:0 0 24px;">
      <p style="color:#9B9490;font-size:13px;margin:0;text-align:center;line-height:1.6;">
        Ovo je automatska obavijest s <a href="${APP_URL}" style="color:#C97B6B;text-decoration:none;">Bebine Liste</a>.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()

  try {
    const result = await resend.emails.send({
      from: `Bebina Lista <${FROM_EMAIL}>`,
      to: params.mamaEmail,
      subject: `&#x1F465; ${params.contributorName} se pridruzio/la grupnoj kupovini za ${params.productName}!`,
      html,
    })
    console.log('Email poslan (group buy):', result.data?.id)
    return result
  } catch (err) {
    console.error('Email greska (group buy):', err)
  }
}

// Dobrodoslica pri registraciji
export async function sendWelcomeEmail(params: WelcomeEmailParams) {
  if (!process.env.RESEND_API_KEY) return

  const html = `
<!DOCTYPE html>
<html lang="hr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #F2D9D0;">
    <div style="background:linear-gradient(135deg,#F2D9D0,#FAF7F2);padding:40px;text-align:center;">
      <p style="font-size:56px;margin:0 0 16px;">🍼</p>
      <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#2C2320;margin:0;">
        Dobrodošla, ${params.name}!
      </h1>
    </div>
    <div style="padding:32px 40px;">
      <p style="color:#6B6360;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Tvoj račun na <strong>Bebinoj Listi</strong> je kreiran. Sada možeš:
      </p>
      <ul style="color:#6B6360;font-size:15px;line-height:2;padding-left:20px;margin:0 0 28px;">
        <li>Kreirati svoju baby listu željenih poklona</li>
        <li>Pretraživati tisuće Baby Center proizvoda</li>
        <li>Podijeliti link s obitelji i prijateljima</li>
        <li>Pratiti tko je što rezervirao</li>
      </ul>
      <div style="text-align:center;">
        <a href="${APP_URL}/moja-lista" 
           style="display:inline-block;background:#C97B6B;color:#fff;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:15px;font-weight:500;">
          Kreiraj svoju listu →
        </a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()

  try {
    await resend.emails.send({
      from: `Bebina Lista <${FROM_EMAIL}>`,
      to: params.email,
      subject: '🍼 Dobrodošla na Bebinu Listu!',
      html,
    })
  } catch (err) {
    console.error('Email greška (welcome):', err)
  }
}
