import dotenv from 'dotenv'
dotenv.config()

import { runBabyCenterScraper } from './babycenter'

runBabyCenterScraper()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Scraper failed:', err)
    process.exit(1)
  })
