import {studio} from '../testHelpers'

export default [
  studio('typing speed simple case', async ({page, baseUrl}) => {
    await page.goto(`${baseUrl}/desk/typingPerfTest;single-root-text-field`, {
      // This is needed on CI servers with restricted resources because it takes a long time to compile the studio js
      timeout: 1000 * 60 * 5,
    })

    const input = await page.waitForSelector('[data-testid="input-rootStringField"] input')

    // clear the input value first
    await input?.evaluate((el: HTMLInputElement) => {
      el.value = ''
    })

    const startTime = new Date().getTime()
    await input?.type('abcdefghijklmnopqrstuvwxyz')

    return {duration: new Date().getTime() - startTime}
  }),
]
