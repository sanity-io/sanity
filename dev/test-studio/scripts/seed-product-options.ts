import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: 'X'}).withConfig({dataset: 'coffee-shop'})

const GRIND_OPTIONS = [
  'Whole bean',
  'Ground — filter',
  'Ground — espresso',
  'Ground — French press',
]

interface SizeOptionInput {
  label: string
  weightGrams: number
  price: number
}

interface SizeOption extends SizeOptionInput {
  _key: string
  _type: 'sizeOption'
}

function withKeys(productId: string, options: SizeOptionInput[]): SizeOption[] {
  return options.map((option, index) => ({
    ...option,
    _key: `${productId}-size-${index}`,
    _type: 'sizeOption',
  }))
}

const SIZES: Record<string, SizeOptionInput[]> = {
  'demo-coffee-product-espresso': [
    {label: '250g', weightGrams: 250, price: 14},
    {label: '340g', weightGrams: 340, price: 18},
    {label: '1kg', weightGrams: 1000, price: 48},
  ],
  'demo-coffee-product-filter': [
    {label: '250g', weightGrams: 250, price: 12},
    {label: '340g', weightGrams: 340, price: 16},
    {label: '1kg', weightGrams: 1000, price: 42},
  ],
  'demo-coffee-product-decaf': [
    {label: '250g', weightGrams: 250, price: 13},
    {label: '340g', weightGrams: 340, price: 17},
    {label: '1kg', weightGrams: 1000, price: 45},
  ],
  'demo-coffee-product-kenya': [
    {label: '200g', weightGrams: 200, price: 18},
    {label: '340g', weightGrams: 340, price: 24},
    {label: '500g', weightGrams: 500, price: 34},
  ],
}

async function run() {
  for (const [id, sizeOptions] of Object.entries(SIZES)) {
    await client
      .patch(id)
      .set({sizeOptions: withKeys(id, sizeOptions), grindOptions: GRIND_OPTIONS})
      .commit({visibility: 'sync'})
    console.log(`done: ${id}`)
  }
  console.log('done — cold-brew kit and bundle intentionally left without size/grind options')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
