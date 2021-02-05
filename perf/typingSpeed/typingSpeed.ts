import {range} from 'lodash'

const puppeteer = require('puppeteer')

type Options = {
  userToken: string
}

async function sampleAvg(samples: number, sampler: () => Promise<number>) {
  const total = await range(0, samples).reduce(async (acc) => {
    return (await acc) + (await sampler())
  }, Promise.resolve(0))

  return total / samples
}

export async function sampleTypingSpeed({userToken}: Options) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.setCookie({
    name: 'sanitySession',
    value: userToken,
    secure: true,
    httpOnly: true,
    sameSite: 'None',
    domain: `.ppsg7ml5.api.sanity.io`,
  })

  await page.goto('http://localhost:3344/desk/typingPerfTest;single-root-text-field', {
    // This is needed on CI servers with restricted resources because it takes a long time to compile the studio js
    timeout: 1000 * 60 * 5,
  })

  const input = await page.waitForSelector('[data-focus-path="rootStringField"] input')

  const avg = await sampleAvg(10, async () => {
    const startTime = new Date().getTime()
    // clear the input value first
    await input.evaluate((el: HTMLInputElement) => {
      el.value = ''
    })
    await input.type('abcdefghijklmnopqrstuvwxyz')
    return new Date().getTime() - startTime
  })

  await browser.close()

  return avg
}
