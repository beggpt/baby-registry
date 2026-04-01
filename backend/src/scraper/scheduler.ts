import cron from 'node-cron'
import { runBabyCenterScraper } from './babycenter'

export function scheduleScraper() {
  // Svaku noć u 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Scheduler: Pokretanje nočnog scrapinga...')
    try {
      await runBabyCenterScraper()
    } catch (err) {
      console.error('Scheduler greška:', err)
    }
  })

  console.log('⏰ Scraper scheduler aktiviran (svaku noć u 02:00)')
}
