import {runTypingSpeedTest} from './typingSpeed/run'

async function runSuite() {
  await runTypingSpeedTest()
}

runSuite().then(
  () => {
    // eslint-disable-next-line no-console
    console.log('Ran performance test suite')
  },
  (err) => {
    // eslint-disable-next-line no-console
    console.error(err)
    process.exit(1)
  }
)
