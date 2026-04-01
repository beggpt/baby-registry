.PHONY: help install dev db scrape

help:
	@echo ""
	@echo "🍼 Bebina Lista — Dostupne naredbe:"
	@echo ""
	@echo "  make install    Instaliraj sve ovisnosti (backend + frontend)"
	@echo "  make db         Pokreni PostgreSQL u Dockeru + kreiraj tablice"
	@echo "  make dev        Pokreni backend i frontend u dev modu"
	@echo "  make scrape     Pokreni Baby Centar scraper"
	@echo ""

install:
	cd backend && npm install
	cd frontend && npm install
	cd backend && npx playwright install chromium
	@echo "✅ Instalacija završena!"

db:
	docker run -d --name baby-registry-db \
		-e POSTGRES_USER=baby \
		-e POSTGRES_PASSWORD=baby123 \
		-e POSTGRES_DB=baby_registry \
		-p 5432:5432 \
		postgres:16-alpine 2>/dev/null || docker start baby-registry-db
	@echo "Čekam bazu..."
	@sleep 3
	cd backend && cp -n .env.example .env || true
	cd backend && npm run db:push
	cd backend && npm run db:seed
	@echo "✅ Baza je spremna!"

dev:
	@echo "Pokrećem backend na :3001 i frontend na :3000"
	cd backend && npm run dev &
	cd frontend && npm run dev

scrape:
	cd backend && npm run scrape
