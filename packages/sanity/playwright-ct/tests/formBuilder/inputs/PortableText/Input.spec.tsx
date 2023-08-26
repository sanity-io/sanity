import {expect, test} from '@playwright/experimental-ct-react'
import React from 'react'
import {testHelpers} from '../../../utils/testHelpers'
import InputStory from './InputStory'

test.describe('Portable Text Input', () => {
  test.describe('Activation', () => {
    test(`Show call to action on focus`, async ({mount}) => {
      const component = await mount(<InputStory />)
      const $portableTextInput = component.getByTestId('field-body')
      const $activeOverlay = $portableTextInput.getByTestId('activate-overlay')

      // Assertion: Show correct text on keyboard focus
      await $activeOverlay.focus()
      await expect($activeOverlay).toHaveText('Click or press space to activate')
    })

    test(`Show call to action on hover`, async ({mount}) => {
      const component = await mount(<InputStory />)
      const $portableTextInput = component.getByTestId('field-body')
      const $activeOverlay = $portableTextInput.getByTestId('activate-overlay')

      // Assertion: Show correct text on pointer hover
      await $activeOverlay.hover()
      await expect($activeOverlay).toHaveText('Click to activate')
    })
  })

  test.describe('Placeholder', () => {
    test(`Displays placeholder text and removes it when typed into`, async ({mount, page}) => {
      await mount(<InputStory />)
      const {getFocusedPortableTextEditor, insertPortableText} = testHelpers({page})
      const $pte = await getFocusedPortableTextEditor('field-body')
      const $placeholder = $pte.getByTestId('pt-input-placeholder')
      // Assertion: placeholder is there
      await expect($placeholder).toHaveText('Empty')
      // Write some text
      await insertPortableText('Hello there', $pte)
      // Assertion: placeholder was removed
      expect(await $placeholder.count()).toEqual(0)
    })
  })
})
