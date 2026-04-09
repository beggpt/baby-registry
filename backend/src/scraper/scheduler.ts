import cron from 'node-cron'
import { runBabyCenterScraper } from './babycenter'
import { runSvijetBebaScraper } from './svijetbeba'

export function scheduleScraper() {
  // Svaku noć u 2:00 AM - Baby Center
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Scheduler: Pokretanje nočnog scrapinga...')
    try {
      await runBabyCenterScraper()
    } catch (err) {
      console.error('Scheduler greška (Baby Center):', err)
    }
  })

  // Svaku noć u 3:00 AM - Svijet Beba
  cron.schedule('0 3 * * *', async () => {
    console.log('⏰ Scheduler: Pokretanje Svijet Beba scrapinga...')
    try {
      await runSvijetBebaScraper()
    } catch (err) {
      console.error('Scheduler greška (Svijet Beba):', err)
    }
  })

  console.log('⏰ Scraper scheduler aktiviran (Baby Center 02:00, Svijet Beba 03:00)')
}
