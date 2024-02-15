/* eslint-disable max-nested-callbacks */
/**
 * TODO: This need to refactored once we have a better e2e framework/setup in place.
 * Makeshift code to reproduce a specific bug.
 */
import {expect} from '@playwright/test'
import {test} from '@sanity/test'

const kanji = `
速ヒマヤレ誌相ルなあね日諸せ変評ホ真攻同潔ク作先た員勝どそ際接レゅ自17浅ッ実情スヤ籍認ス重力務鳥の。8平はートご多乗12青國暮整ル通国うれけこ能新ロコラハ元横ミ休探ミソ梓批ざょにね薬展むい本隣ば禁抗ワアミ部真えくト提知週むすほ。査ル人形ルおじつ政謙減セヲモ読見れレぞえ録精てざ定第ぐゆとス務接産ヤ写馬エモス聞氏サヘマ有午ごね客岡ヘロ修彩枝雨父のけリド。

住ゅなぜ日16語約セヤチ任政崎ソオユ枠体ぞン古91一専泉給12関モリレネ解透ぴゃラぼ転地す球北ドざう記番重投ぼづ。期ゃ更緒リだすし夫内オ代他られくド潤刊本クヘフ伊一ウムニヘ感週け出入ば勇起ょ関図ぜ覧説めわぶ室訪おがト強車傾町コ本喰杜椿榎ほれた。暮る生的更芸窓どさはむ近問ラ入必ラニス療心コウ怒応りめけひ載総ア北吾ヌイヘ主最ニ余記エツヤ州5念稼め化浮ヌリ済毎養ぜぼ。
`.trim()

test.describe('inputs: text', () => {
  test.slow() // Because of waiting for mutations, remote values etc

  test('correctly applies kanji edits', async ({page, sanityClient, createDraftDocument}) => {
    const documentId = await createDraftDocument('/test/content/input-ci;textsTest')

    function getRemoteValue() {
      return sanityClient
        .getDocument(`drafts.${documentId}`)
        .then((doc) => {
          // eslint-disable-next-line no-console
          console.log('doc', doc)
          return doc ? doc.simple : null
        })
        .catch((err) => {
          console.error('Error fetching remote value', err)
          return null
        })
    }

    await page.waitForSelector('data-testid=field-simple', {timeout: 30000})
    const field = page.getByTestId('field-simple').getByRole('textbox')

    const response1 = page.waitForResponse(/mutate/)
    await field.fill(kanji)
    // Enter initial text and wait for the mutate call to be sent
    await response1

    // Expect the document to now have the base value
    let currentExpectedValue = kanji
    await expect(field).toHaveValue(currentExpectedValue)
    await expect(await getRemoteValue()).toBe(currentExpectedValue)

    // Edit the value to start with "Paragraph 1: "
    const p1Prefix = 'Paragraph 1: '
    let nextExpectedValue = `${p1Prefix}${kanji}`
    const response2 = page.waitForResponse(/mutate/)
    await field.fill(nextExpectedValue)
    await response2

    // Expect both the browser input and the document to now have the updated value
    currentExpectedValue = `${p1Prefix}${kanji}`
    await expect(field).toHaveValue(currentExpectedValue)
    await expect(await getRemoteValue()).toBe(currentExpectedValue)

    // Now move to the end of the paragraph and add a suffix
    const p1Suffix = ' (end of paragraph 1)'
    nextExpectedValue = currentExpectedValue.replace(/\n\n/, `${p1Suffix}\n\n`)
    const response3 = page.waitForResponse(/mutate/)
    await field.fill(nextExpectedValue)
    await response3

    // Expect both the browser input and the document to now have the updated value
    currentExpectedValue = nextExpectedValue
    await expect(field).toHaveValue(currentExpectedValue)
    await expect(await getRemoteValue()).toBe(currentExpectedValue)

    // Move to the end of the field and add a final suffix
    const p2Suffix = `. EOL.`
    nextExpectedValue = `${currentExpectedValue}${p2Suffix}`
    const response4 = page.waitForResponse(/mutate/)
    await field.fill(nextExpectedValue)
    await response4

    // Expect both the browser input and the document to now have the updated value
    currentExpectedValue = nextExpectedValue
    await expect(field).toHaveValue(currentExpectedValue)
    await expect(await getRemoteValue()).toBe(currentExpectedValue)
  })
})
