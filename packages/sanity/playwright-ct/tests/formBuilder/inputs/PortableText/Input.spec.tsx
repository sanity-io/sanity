import {expect, test} from '@playwright/experimental-ct-react'
import React from 'react'
import {testHelpers} from '../../../utils/testHelpers'
import InputStory from './InputStory'

test.describe('Input', () => {
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
})
