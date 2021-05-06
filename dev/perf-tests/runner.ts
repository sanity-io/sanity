import {createReportDocs} from './datastore/createReport'
import {Test} from './testHelpers'
import typingSpeed from './typingSpeed/typingSpeed'

const SAMPLES = 4

async function runTest(baseUrl: string, test: Test) {
  const samples = []
  let sampleNo = SAMPLES
  while (sampleNo--) {
    const {duration} = await test.fn(baseUrl)
    samples.push(duration)
  }

  return createReportDocs(test.name, samples)
}

async function runAll(baseUrl: string) {
  for (const test of typingSpeed) {
    console.log(await runTest(baseUrl, test))
  }
}

runAll('http://localhost:3344')
