import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: 'X'}).withConfig({dataset: 'coffee-shop'})

async function run() {
  await client
    .patch('demo-coffee-landing')
    .unset([
      'sections[_key=="promo"].title',
      'sections[_key=="promo"].tagline',
      'sections[_key=="promo"].ctaLabel',
    ])
    .commit({visibility: 'sync'})
  console.log('done: promo banner now falls through to the promo reference')
}
run().catch((e) => {
  console.error(e)
  process.exit(1)
})
