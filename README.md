# 🍼 Bebina Lista — Baby Registry App

Baby registry aplikacija s web scraperom za Baby Centar. Buduće mame kreiraju wish liste, dijele ih s prijateljima, a prijatelji rezerviraju poklone upisivanjem svog imena.

---

## Arhitektura

```
baby-registry/
├── backend/          # Node.js + Express + Prisma + Playwright
└── frontend/         # Next.js 14 + Tailwind CSS
```

---

## 🚀 Setup

### 1. Baza podataka

Trebaš PostgreSQL. Lokalno s Dockerom:

```bash
docker run -d \
  --name baby-registry-db \
  -e POSTGRES_USER=baby \
  -e POSTGRES_PASSWORD=baby123 \
  -e POSTGRES_DB=baby_registry \
  -p 5432:5432 \
  postgres:16
```

### 2. Backend

```bash
cd backend

# Kopiraj .env
cp .env.example .env
# Uredi DATABASE_URL i JWT_SECRET u .env

# Instaliraj ovisnosti
npm install

# Installiraj Playwright browser
npx playwright install chromium

# Kreiraj bazu
npm run db:push

# Pokreni dev server
npm run dev
```

Backend radi na `http://localhost:3001`

### 3. Frontend

```bash
cd frontend

# Kopiraj .env
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local

# Instaliraj ovisnosti
npm install

# Pokreni dev server
npm run dev
```

Frontend radi na `http://localhost:3000`

### 4. Pokretanje scrapera

```bash
cd backend
npm run scrape
```

Ovo će scrapati sve kategorije s Baby Centar i pohraniti ih u bazu.

---

## 📡 API Endpointi

### Auth
| Metoda | Endpoint             | Opis                    |
|--------|---------------------|-------------------------|
| POST   | /api/auth/register  | Registracija             |
| POST   | /api/auth/login     | Prijava                  |
| GET    | /api/auth/me        | Trenutni korisnik        |
| PATCH  | /api/auth/profile   | Ažuriranje profila       |

### Liste
| Metoda | Endpoint                         | Opis                          |
|--------|----------------------------------|-------------------------------|
| GET    | /api/lists                       | Sve liste korisnika           |
| POST   | /api/lists                       | Nova lista                    |
| GET    | /api/lists/:id                   | Jedna lista                   |
| PATCH  | /api/lists/:id                   | Ažuriranje liste              |
| DELETE | /api/lists/:id                   | Brisanje liste                |
| POST   | /api/lists/:id/items             | Dodaj proizvod na listu       |
| PATCH  | /api/lists/:id/items/:itemId     | Ažuriranje stavke             |
| DELETE | /api/lists/:id/items/:itemId     | Ukloni stavku                 |

### Javna lista (bez prijave)
| Metoda | Endpoint                                    | Opis                              |
|--------|---------------------------------------------|-----------------------------------|
| GET    | /api/public/lista/:slug                     | Dohvati javnu listu               |
| POST   | /api/public/lista/:slug/rezerviraj/:itemId  | **Rezervacija s imenom**          |
| DELETE | /api/public/lista/:slug/rezerviraj/:itemId  | Otkazivanje rezervacije           |

### Proizvodi
| Metoda | Endpoint                 | Opis                            |
|--------|--------------------------|---------------------------------|
| GET    | /api/products            | Pretraživanje (q, kategorija, cijena...) |
| GET    | /api/products/categories | Sve kategorije                  |
| GET    | /api/products/:id        | Jedan proizvod                  |

### Admin
| Metoda | Endpoint                       | Opis                          |
|--------|-------------------------------|-------------------------------|
| GET    | /api/admin/shops              | Popis shopova                 |
| POST   | /api/admin/shops/:slug/scrape | Pokretanje scrapera           |
| GET    | /api/admin/stats              | Statistike                    |

---

## 📱 Stranice frontenda

| URL                  | Opis                                           |
|----------------------|------------------------------------------------|
| `/`                  | Landing page                                   |
| `/katalog`           | Pretraživanje i filtriranje proizvoda           |
| `/moja-lista`        | Dashboard mame — upravljanje listama           |
| `/lista/:slug`       | **Javna lista za prijatelje + rezervacija**    |
| `/prijava`           | Login stranica                                 |
| `/registracija`      | Registracija                                   |

---

## 🕷️ Scraper detalji

Scraper koristi **Playwright** (headless Chromium) za scraping Baby Centar-a.

**Kategorije koje se scrapeaju:**
- Kolica
- Autosjedalice  
- Nosiljke
- Kod kuće (kreveti, posteljina, igračke...)
- Hranjenje i njega
- Igračke
- Za mame
- Odjeća

**Automatski re-scrape:** Svaku noć u 02:00 (node-cron).

**Što se sprema:** naziv, cijena, slika, URL, dostupnost, shop, kategorija.

---

## 🔄 Tok rezervacije (prijatelji)

1. Mama kreira listu i dobiva share link: `/lista/abc123def456`
2. Šalje link prijateljima (WhatsApp, email, Instagram...)
3. Prijatelji otvore link — **bez registracije**
4. Kliknu "Kupit ću ovo" na željenom proizvodu
5. **Upisuju svoje ime** (i opcionalnu poruku za mamu)
6. Proizvod se označi kao rezerviran s njihovim imenom
7. Mama u svom dashboardu vidi tko je što rezervirao
8. Prijatelji se preusmjeravaju direktno na shop za kupnju

---

## 🛠️ Tech Stack

| Sloj      | Tehnologija                          |
|-----------|--------------------------------------|
| Frontend  | Next.js 14, TypeScript, Tailwind CSS |
| Backend   | Node.js, Express, TypeScript         |
| ORM       | Prisma                               |
| Baza      | PostgreSQL                           |
| Scraping  | Playwright (Chromium)                |
| Scheduler | node-cron                            |
| Auth      | JWT (bcryptjs)                       |
| Validacija| Zod                                  |

---

## 📋 Sljedeći koraci

- [ ] Email notifikacije (Resend) — mama dobiva email kad netko rezervira
- [ ] Admin panel UI
- [ ] Dodavanje još shopova (Mothercare, Amazon...)
- [ ] Promjena statusa iz "rezervirano" u "kupljeno"
- [ ] Slanje poruke mami
- [ ] PWA za mobilne uređaje
- [ ] Social sharing preview (OG tags)
