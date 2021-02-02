const puppeteer = require('puppeteer')

type Options = {
  userToken: string
}

export async function testTypingSpeed({userToken}: Options) {
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

  // clear the input value first
  await input.evaluate((el: HTMLInputElement) => {
    el.value = ''
  })

  const startTime = new Date().getTime()
  await input.type('abcdefghijklmnopqrstuvwxyz')

  const elapsedTime = new Date().getTime() - startTime

  await browser.close()

  return elapsedTime
}
