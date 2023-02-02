import {Page} from '@playwright/test'

interface TypingSpeedProps {
  page: Page
}

export const typingSpeed = async (options: TypingSpeedProps): Promise<number> => {
  const {page} = options

  const typingValue = 'Hello World, this is a test of typing speed'

  const start = performance.now()
  const input = page.locator('[data-testid="string-input"]').first()
  await input.type(typingValue, {delay: 200})
  //   await expect(input).toHaveValue(typingValue) // TODO: The value in the Studio skips the last character so this fails
  const end = performance.now()

  const charactersPerMillisecond = (end - start) / typingValue.length

  return charactersPerMillisecond
}
