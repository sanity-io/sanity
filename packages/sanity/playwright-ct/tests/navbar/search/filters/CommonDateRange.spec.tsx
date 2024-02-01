import {expect, test} from '@playwright/experimental-ct-react'
import {CommonDateRangeStory} from './CommonDateRangeStory'

const INITIAL_FOCUSED_DATE = new Date('2000-01-01')
const INITIAL_DATE_START = '2000-01-07'
const INITIAL_DATE_END = '2000-01-14'

test.use({viewport: {height: 600, width: 600}})

test.describe('CommonDateRange', () => {
  test.describe('initialFocusedDate', () => {
    test('Should display the correct month when a focus date is provided', async ({
      mount,
      page,
    }) => {
      await mount(<CommonDateRangeStory initialFocusedDate={INITIAL_FOCUSED_DATE} />)
      const $focusedDate = page.locator('[data-focused-date="2000-01-01"]')
      await expect($focusedDate).toBeVisible()
    })
  })

  test.describe('sequenced clicks', () => {
    test('Should display a range when selecting two dates in sequence', async ({mount, page}) => {
      const dateFirst = '2000-01-07'
      const dateSecond = '2000-01-14'

      await mount(<CommonDateRangeStory initialFocusedDate={INITIAL_FOCUSED_DATE} />)

      const $dateFirst = page.locator(`[data-date="${dateFirst}"]`)
      const $dateSecond = page.locator(`[data-date="${dateSecond}"]`)
      await $dateFirst.click()
      await $dateSecond.click()

      await expect($dateFirst).toHaveAttribute('data-selected')
      await expect($dateFirst).toHaveAttribute('data-start-date', 'true')
      await expect($dateSecond).toHaveAttribute('data-selected')
      await expect($dateSecond).toHaveAttribute('data-end-date', 'true')
    })

    test('Should display only the end date in a range when selecting two dates in reverse sequence', async ({
      mount,
      page,
    }) => {
      const dateFirst = '2000-01-14'
      const dateSecond = '2000-01-07'

      await mount(<CommonDateRangeStory initialFocusedDate={INITIAL_FOCUSED_DATE} />)

      const $dateFirst = page.locator(`[data-date="${dateFirst}"]`)
      const $dateSecond = page.locator(`[data-date="${dateSecond}"]`)
      await $dateFirst.click()
      await $dateSecond.click()

      await expect($dateFirst).not.toHaveAttribute('data-selected')
      await expect($dateFirst).not.toHaveAttribute('data-start-date', 'true')
      await expect($dateSecond).toHaveAttribute('data-selected')
      await expect($dateSecond).toHaveAttribute('data-end-date', 'true')
    })
  })

  test.describe('clicks before or after the current range', () => {
    test('Should expand the selected range when selecting a date before previous start date', async ({
      mount,
      page,
    }) => {
      const targetDateStart = '2000-01-01'

      await mount(
        <CommonDateRangeStory
          initialFocusedDate={INITIAL_FOCUSED_DATE}
          initialValue={{from: INITIAL_DATE_START, to: INITIAL_DATE_END}}
        />,
      )

      const $dateStart = page.locator(`[data-date="${targetDateStart}"]`)
      const $dateEnd = page.locator(`[data-date="${INITIAL_DATE_END}"]`)
      await $dateStart.click()

      await expect($dateStart).toHaveAttribute('data-selected')
      await expect($dateStart).toHaveAttribute('data-start-date', 'true')
      await expect($dateEnd).toHaveAttribute('data-selected')
      await expect($dateEnd).toHaveAttribute('data-end-date', 'true')
    })

    test('Should create a new range when selecting a date after the previous end date', async ({
      mount,
      page,
    }) => {
      const targetDateEnd = '2000-01-21'

      await mount(
        <CommonDateRangeStory
          initialFocusedDate={INITIAL_FOCUSED_DATE}
          initialValue={{from: INITIAL_DATE_START, to: INITIAL_DATE_END}}
        />,
      )

      const $dateStart = page.locator(`[data-date="${INITIAL_DATE_START}"]`)
      const $dateEnd = page.locator(`[data-date="${targetDateEnd}"]`)
      await $dateEnd.click()

      await expect($dateStart).not.toHaveAttribute('data-selected')
      await expect($dateStart).not.toHaveAttribute('data-start-date', 'true')
      await expect($dateEnd).toHaveAttribute('data-selected')
      await expect($dateEnd).toHaveAttribute('data-start-date', 'true')
    })
  })

  test.describe('focusing text inputs', () => {
    test('Should update the selected range start date when focusing the start date input prior', async ({
      mount,
      page,
    }) => {
      const targetDateStart = '2000-01-09'

      await mount(
        <CommonDateRangeStory
          initialFocusedDate={INITIAL_FOCUSED_DATE}
          initialValue={{from: INITIAL_DATE_START, to: INITIAL_DATE_END}}
        />,
      )

      const $inputStart = page.getByTestId('input-start-date')
      await $inputStart.focus()

      const $dateStart = page.locator(`[data-date="${targetDateStart}"]`)
      const $dateEnd = page.locator(`[data-date="${INITIAL_DATE_END}"]`)
      await $dateStart.click()

      await expect($dateStart).toHaveAttribute('data-selected')
      await expect($dateStart).toHaveAttribute('data-start-date', 'true')
      await expect($dateEnd).toHaveAttribute('data-selected')
      await expect($dateEnd).toHaveAttribute('data-end-date', 'true')
    })

    test('Should update the selected range end date when focusing the end date input prior', async ({
      mount,
      page,
    }) => {
      const targetDateEnd = '2000-01-12'

      await mount(
        <CommonDateRangeStory
          initialFocusedDate={INITIAL_FOCUSED_DATE}
          initialValue={{from: INITIAL_DATE_START, to: INITIAL_DATE_END}}
        />,
      )

      const $inputEnd = page.getByTestId('input-end-date')
      await $inputEnd.focus()

      const $dateStart = page.locator(`[data-date="${INITIAL_DATE_START}"]`)
      const $dateEnd = page.locator(`[data-date="${targetDateEnd}"]`)
      await $dateEnd.click()

      await expect($dateStart).toHaveAttribute('data-selected')
      await expect($dateStart).toHaveAttribute('data-start-date', 'true')
      await expect($dateEnd).toHaveAttribute('data-selected')
      await expect($dateEnd).toHaveAttribute('data-end-date', 'true')
    })
  })

  test.describe('alternative selectTarget', () => {
    test('Should select the start date of a range (with the next click) if only the end date is present', async ({
      mount,
      page,
    }) => {
      const targetDateStart = '2000-01-01'

      await mount(
        <CommonDateRangeStory
          initialFocusedDate={INITIAL_FOCUSED_DATE}
          initialValue={{from: null, to: INITIAL_DATE_END}}
        />,
      )

      const $dateStart = page.locator(`[data-date="${targetDateStart}"]`)
      const $dateEnd = page.locator(`[data-date="${INITIAL_DATE_END}"]`)
      await $dateStart.click()

      await expect($dateStart).toHaveAttribute('data-selected')
      await expect($dateStart).toHaveAttribute('data-start-date', 'true')
      await expect($dateEnd).toHaveAttribute('data-selected')
      await expect($dateEnd).toHaveAttribute('data-end-date', 'true')
    })

    test('Should re-select the start date of a range (with the next click) if only the start date is present', async ({
      mount,
      page,
    }) => {
      const targetDateEnd = '2000-01-30'

      await mount(
        <CommonDateRangeStory
          initialFocusedDate={INITIAL_FOCUSED_DATE}
          initialValue={{from: INITIAL_DATE_START, to: null}}
        />,
      )

      const $dateFirst = page.locator(`[data-date="${INITIAL_DATE_START}"]`)
      const $dateSecond = page.locator(`[data-date="${targetDateEnd}"]`)
      await $dateSecond.click()

      await expect($dateFirst).not.toHaveAttribute('data-selected')
      await expect($dateFirst).not.toHaveAttribute('data-start-date', 'true')
      await expect($dateSecond).toHaveAttribute('data-selected')
      await expect($dateSecond).toHaveAttribute('data-start-date', 'true')
    })
  })
})
