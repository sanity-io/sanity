/**
 * TODO: This need to refactored once we have a better e2e framework/setup in place.
 * Makeshift code to reproduce a specific bug.
 */
import {platform} from 'os'
import {test, expect} from '@playwright/test'
import {uuid} from '@sanity/uuid'
import {testSanityClient} from '../../helpers'

const isMac = platform() === 'darwin'
const documentIds = new Set<string>()

function getUniqueDocumentId() {
  const documentId = uuid()
  documentIds.add(documentId)
  return documentId
}

const kanji = `
速ヒマヤレ誌相ルなあね日諸せ変評ホ真攻同潔ク作先た員勝どそ際接レゅ自17浅ッ実情スヤ籍認ス重力務鳥の。8平はートご多乗12青國暮整ル通国うれけこ能新ロコラハ元横ミ休探ミソ梓批ざょにね薬展むい本隣ば禁抗ワアミ部真えくト提知週むすほ。査ル人形ルおじつ政謙減セヲモ読見れレぞえ録精てざ定第ぐゆとス務接産ヤ写馬エモス聞氏サヘマ有午ごね客岡ヘロ修彩枝雨父のけリド。

住ゅなぜ日16語約セヤチ任政崎ソオユ枠体ぞン古91一専泉給12関モリレネ解透ぴゃラぼ転地す球北ドざう記番重投ぼづ。期ゃ更緒リだすし夫内オ代他られくド潤刊本クヘフ伊一ウムニヘ感週け出入ば勇起ょ関図ぜ覧説めわぶ室訪おがト強車傾町コ本喰杜椿榎ほれた。暮る生的更芸窓どさはむ近問ラ入必ラニス療心コウ怒応りめけひ載総ア北吾ヌイヘ主最ニ余記エツヤ州5念稼め化浮ヌリ済毎養ぜぼ。
`.trim()

test.describe('inputs: text', () => {
  test('correctly applies kanji edits', async ({page}) => {
    const documentId = getUniqueDocumentId()
    await page.goto(`/test/content/input-ci;textsTest;${documentId}`)

    function getRemoteValue() {
      return testSanityClient
        .getDocument(`drafts.${documentId}`)
        .then((doc) => (doc ? doc.simple : null))
    }

    await page.waitForSelector('data-testid=field-simple', {timeout: 30000})
    const field = page.getByTestId('field-simple').getByRole('textbox')

    // Enter initial text and wait for the mutate call to be sent
    const response = page.waitForResponse(/mutate/)
    await field.fill(kanji)
    await response

    // Expect the document to now have the base value
    let currentExpectedValue = kanji
    expect(await field.inputValue()).toBe(currentExpectedValue)
    expect(await getRemoteValue()).toBe(currentExpectedValue)

    // Set caret to the start of the field
    await field.focus()
    await field.press(isMac ? 'Meta+A' : 'Ctrl+A') // Select all the text
    await field.press('ArrowLeft') // Press left arrow to go to start of field

    // Edit the value to start with "Paragraph 1: "
    const p1Prefix = 'Paragraph 1: '
    await field.type(p1Prefix, {delay: 20})
    await page.waitForTimeout(1000) // Hack, we need to wait for the mutation to be received

    // Expect both the browser input and the document to now have the updated value
    currentExpectedValue = `${p1Prefix}${kanji}`
    expect(await field.inputValue()).toBe(currentExpectedValue)
    expect(await getRemoteValue()).toBe(currentExpectedValue)

    // Now move to the end of the paragraph and add a suffix
    const paragraphEndPosition = currentExpectedValue.indexOf('\n')
    const p1Suffix = ' (end of paragraph 1)'
    // Note: can't find a reliable way of going to end of line through keyboard.
    // Control + E works on Chrome but not Firefox.
    // await field.press('Control+E') // Move to end of paragraph
    const handle = await field.elementHandle()
    expect(handle).not.toBe(null)
    await handle?.evaluate((el, charIndex) => {
      ;(el as HTMLTextAreaElement).selectionStart = charIndex
    }, paragraphEndPosition)

    await field.type(p1Suffix, {delay: 20})
    await page.waitForTimeout(1000) // Hack, we need to wait for the mutation to be received

    // Expect both the browser input and the document to now have the updated value
    currentExpectedValue = currentExpectedValue.replace(/\n\n/, `${p1Suffix}\n\n`)
    expect(await field.inputValue()).toBe(currentExpectedValue)
    expect(await getRemoteValue()).toBe(currentExpectedValue)

    // Move to the end of the field and add a final suffix
    const p2Suffix = `. EOL.`
    await field.press(isMac ? 'Meta+ArrowDown' : 'Ctrl+End') // Move to end of field
    await field.type(p2Suffix, {delay: 20})
    await page.waitForTimeout(1000) // Hack, we need to wait for the mutation to be received

    // Expect both the browser input and the document to now have the updated value
    currentExpectedValue = `${currentExpectedValue}${p2Suffix}`
    expect(await field.inputValue()).toBe(currentExpectedValue)
    expect(await getRemoteValue()).toBe(currentExpectedValue)
  })

  test.afterAll(async () => {
    await testSanityClient.delete({
      query: '*[_id in $ids]',
      params: {ids: [...documentIds].map((id) => `drafts.${id}`)},
    })
  })
})
