import {expect} from '@playwright/test'

import {test} from '../../studio-test'
// Skip: Mouse drag selection across paragraphs is inherently unreliable in E2E testing
// due to timing variability, text block positioning, and selection event handling.
// @TODO: figure out a way to make this test reliable somewhere / somehow
test.skip('Portable Text Input - Fullscreen Backwards Select', () => {
  test.beforeEach(async ({page, createDraftDocument, browserName}) => {
    test.skip(browserName === 'firefox')
    test.slow()
    await createDraftDocument('/content/input-standard;portable-text;pt_allTheBellsAndWhistles')

    const pteEditor = page.getByTestId('field-text')
    // Wait for the text block to be editable
    await expect(
      pteEditor.locator('[data-testid="text-block__text"]:not([data-read-only="true"])'),
    ).toBeVisible()

    // Set up the portable text editor
    await pteEditor.focus()
    await pteEditor.click()

    // Make the editor fullscreen
    await expect(
      page.getByTestId('field-text').getByTestId('fullscreen-button-expand'),
    ).toBeVisible()
    await page.getByTestId('field-text').getByTestId('fullscreen-button-expand').click()

    // The collapse button should be visible when the editor is fullscreen
    await expect(page.getByTestId('fullscreen-button-collapse')).toBeVisible()

    // Fill with multiple paragraphs of Lorem Ipsum text
    const textbox = page.getByTestId('document-panel-portal').getByRole('textbox')
    await textbox.click()

    const paragraphs = [
      'Paragraph 1. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum mi libero, bibendum vitae nisl tristique, vehicula auctor magna. Donec ornare blandit sagittis. Nulla ullamcorper urna vitae mi fringilla condimentum. Phasellus vulputate purus a leo lobortis convallis. Nam in justo sed est imperdiet dictum. Quisque vitae odio at arcu eleifend fringilla. Morbi eu ipsum odio. Praesent sagittis porta est.',
      'Paragraph 2. Suspendisse quis molestie lorem. Pellentesque pulvinar mi non nisi egestas, et sagittis orci tempor. Vivamus quis dictum justo. Aenean nibh diam, volutpat eget est nec, tincidunt mattis purus. In bibendum dictum ultricies. Quisque porttitor sagittis porttitor. Duis dapibus, massa vel semper faucibus, sem metus blandit eros, dignissim ultrices enim justo non est. Nam commodo eget nulla eget porttitor. Morbi lobortis elementum erat, at vehicula velit ultricies non.',
      'Paragraph 3. Fusce at arcu sed purus molestie gravida. Donec imperdiet lorem ex, ut sollicitudin mi ornare et. Cras sollicitudin facilisis purus id vestibulum. Nulla eu pulvinar sem. Vivamus dolor eros, semper ut mauris a, malesuada facilisis leo. Donec ut nibh convallis, vulputate velit in, euismod velit. Morbi dapibus elit in ligula dignissim, non pulvinar ligula faucibus. Nam vulputate vestibulum nibh sed dignissim. Sed pretium imperdiet urna eu semper. Donec ornare lacus eu neque luctus convallis. Interdum et malesuada fames ac ante ipsum primis in faucibus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum aliquam fermentum est, vel congue sapien pretium non. Mauris iaculis, diam vitae egestas auctor, turpis nibh varius turpis, id molestie lectus ligula vel ligula.',
      'Paragraph 4. Ut et sem velit. Nunc et ligula nisi. Suspendisse id mollis velit, id consequat leo. Aliquam mollis erat sit amet nibh ullamcorper laoreet. Donec consectetur arcu magna, quis tincidunt lectus ullamcorper cursus. Quisque varius fringilla iaculis. Mauris diam risus, blandit eu lobortis nec, aliquam euismod metus. Nullam pharetra pulvinar ipsum sed sollicitudin. Nulla at eleifend quam, quis tincidunt metus. Maecenas scelerisque scelerisque aliquam.',
      'Paragraph 5. Suspendisse sed tortor non nisi auctor dapibus eleifend eget tellus. Proin id dolor rhoncus, lacinia quam non, ultrices sem. Curabitur porta, enim fermentum vulputate elementum, enim sem dictum tortor, ac interdum metus lectus sit amet magna. Fusce gravida, libero nec consequat elementum, erat turpis ornare nunc, eu sollicitudin odio elit eu turpis. Mauris pharetra dictum risus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam condimentum fermentum risus ut placerat. Duis eleifend augue vitae erat vestibulum, ut dignissim elit pellentesque. Sed vulputate sapien sem, sit amet facilisis risus porttitor nec. Nullam vel eleifend justo. Mauris quam turpis, porttitor eget pharetra non, blandit ut lorem. Nunc eu purus leo. Sed sapien metus, consectetur vel euismod vitae, aliquam sit amet ligula. Sed sagittis quis metus convallis congue. Donec ornare velit odio, sit amet rutrum nunc pretium at.',
    ]

    for (let i = 0; i < paragraphs.length; i++) {
      await page.keyboard.insertText(paragraphs[i].trim())

      if (i < paragraphs.length - 1) {
        await page.keyboard.press('Enter')
      }
    }
  })

  test('you should be able to backwards select text in fullscreen mode with mouse drag', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === 'firefox')
    test.slow()

    const portal = page.getByTestId('document-panel-portal')

    // Get all text blocks - we have 5 paragraphs
    const textBlocks = portal.locator('[data-testid="text-block__text"]')
    await expect(textBlocks).toHaveCount(5)

    // Get the 5th text block (index 4) - contains "Suspendisse sed tortor..."
    // We want somewhere in the block
    const fifthBlock = textBlocks.nth(4)
    // Get the 4th text block (index 3) - contains "Ut et sem velit. Nunc et ligula nisi..."
    // We want somewhere in the bloc
    const fourthBlock = textBlocks.nth(3)

    // Get bounding boxes for the text blocks
    // We are doing this in order to be able to backwards select the middle of the blocks
    const fifthBox = await fifthBlock.boundingBox()
    const fourthBox = await fourthBlock.boundingBox()

    if (!fifthBox || !fourthBox) {
      throw new Error('Could not get bounding boxes for text blocks')
    }

    // Start position: beginning of 5th block (where "Suspendisse sed tortor" starts)
    const startX = fifthBox.x + 95
    const startY = fifthBox.y + 10

    // End position: somewhere in the middle of 4th block (where "Nunc et ligula nisi" is)
    // We go to roughly the middle of the block horizontally to land on that text
    const endX = fourthBox.x + 100
    const endY = fourthBox.y + 10

    // Perform click and drag backwards (from 5th paragraph up to 4th paragraph)
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(endX, endY, {steps: 30})
    await page.mouse.up()

    // Wait for a valid cross-paragraph selection to be established
    // This polls until the selection contains text from both paragraphs
    const selectionHandle = await page.waitForFunction(
      () => {
        const selection = window.getSelection()?.toString()
        // Selection should contain text from paragraph 5 (where we started)
        if (selection && selection.includes('Paragraph 5.')) {
          return selection
        }
        return null
      },
      {timeout: 5000},
    )

    const selectedText = await selectionHandle.jsonValue()

    // The selection should include text spanning from the 4th to 5th paragraph
    // It should contain parts of both paragraphs
    expect(selectedText).toBeTruthy()

    // The selection should span across the paragraph boundary and not break
    /** Visually it will be this (middle to end part of paragraph 4 and start of paragraph 5):
     *
     * Ut et sem velit. Nunc et ligula nisi. Suspendisse id mollis velit, id consequat leo.
     * Aliquam mollis erat sit amet nibh ullamcorper laoreet.
     * Donec consectetur arcu magna, quis tincidunt lectus ullamcorper cursus. Quisque varius fringilla iaculis.
     * Mauris diam risus, blandit eu lobortis nec, aliquam euismod metus.
     * Nullam pharetra pulvinar ipsum sed sollicitudin.
     * Nulla at eleifend quam, quis tincidunt metus.
     * Maecenas scelerisque scelerisque aliquam.
     *
     * Paragraph 5.
     */
    expect(selectedText).toContain('scelerisque aliquam.\nParagraph 5.')
  })
})
