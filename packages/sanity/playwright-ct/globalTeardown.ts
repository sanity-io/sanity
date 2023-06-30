import {bsLocal} from './browserstack.config'
import {promisify} from 'util'

const sleep = promisify(setTimeout)

export default async (): Promise<void> => {
  // Stop the Local instance after your test run is completed, i.e after driver.quit

  if (bsLocal && bsLocal.isRunning()) {
    await new Promise<void>((resolve) => {
      bsLocal.stop(() => {
        // eslint-disable-next-line no-console
        console.log('Stopped BrowserStackLocal')
        resolve()
      })
    })
  }
}
