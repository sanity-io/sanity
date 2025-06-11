import {uploadBundles} from '@repo/bundle-manager'

uploadBundles().catch((err) => {
  console.error(err)
  process.exit(1)
})
