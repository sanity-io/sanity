import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2025-03-19'}).withConfig({dataset: 'coffee-shop'})

const IMAGES: Record<string, string> = {
  'demo-coffee-product-espresso': '1510591509098-f4fdc6d0ff04',
  'demo-coffee-product-filter': '1521302080334-4bebac2763a6',
  'demo-coffee-product-cold-brew': '1517701604599-bb29b565090c',
  'demo-coffee-product-decaf': '1506372023823-741c83b836fe',
  'demo-coffee-product-kenya': '1524350876685-274059332603',
  'demo-coffee-product-bundle': '1497935586351-b67a49e012bf',
  'demo-coffee-origin-ethiopia': '1442550528053-c431ecb55509',
  'demo-coffee-origin-colombia': '1459755486867-b55449bb39ff',
  'demo-coffee-origin-brazil': '1442512595331-e89e73853f31',
  'demo-coffee-origin-guatemala': '1541167760496-1628856ab772',
  'demo-coffee-origin-kenya': '1495774856032-8b90bbb32b32',
}

const HERO_PHOTO_ID = '1554118811-1e0d58224f24'

async function uploadUnsplashImage(photoId: string, filename: string) {
  const res = await fetch(`https://images.unsplash.com/photo-${photoId}?w=1200&q=80`)
  if (!res.ok) throw new Error(`Failed to fetch photo-${photoId}: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  return client.assets.upload('image', buffer, {filename})
}

async function run() {
  for (const [docId, photoId] of Object.entries(IMAGES)) {
    const asset = await uploadUnsplashImage(photoId, `${docId}.jpg`)
    await client
      .patch(docId)
      .set({image: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}}})
      .commit({visibility: 'sync'})
    console.log(`done: ${docId}`)
  }

  const heroAsset = await uploadUnsplashImage(HERO_PHOTO_ID, 'hero.jpg')
  await client
    .patch('demo-coffee-landing')
    .set({
      'sections[_key=="hero"].image': {
        _type: 'image',
        asset: {_type: 'reference', _ref: heroAsset._id},
      },
    })
    .commit({visibility: 'sync'})
  console.log('done: hero section image')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
