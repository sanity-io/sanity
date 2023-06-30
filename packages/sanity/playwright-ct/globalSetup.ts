// global-setup.ts
import {bsLocal, BS_LOCAL_ARGS} from './browserstack.config'
import {promisify} from 'node:util'

const sleep = promisify(setTimeout)
const redColour = '\x1b[31m'
const whiteColour = '\x1b[0m'
const greenColour = '\x1b[32m'

export default async (): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log('Starting BrowserStackLocal ...')
  // Starts the Local instance with the required arguments
  const {key} = BS_LOCAL_ARGS

  if (bsLocal.isRunning()) {
    // eslint-disable-next-line no-console
    console.log(`${greenColour}BrowserStackLocal is already running, skipping run${whiteColour}`)

    return
  }

  await new Promise<void>((resolve, reject) => {
    bsLocal.start({key}, (err: Error | undefined) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error(`${redColour}Error starting BrowserStackLocal${whiteColour}: ${err.message}`)
        reject(err)
      } else {
        // eslint-disable-next-line no-console
        console.log('BrowserStackLocal Started')
        resolve()
      }
    })
  })
}
