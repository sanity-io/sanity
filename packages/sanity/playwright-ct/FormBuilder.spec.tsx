import {expect, test} from '@playwright/experimental-ct-react'
import React from 'react'

import {FormBuilderStory} from './FormBuilderStory'

test.use({viewport: {width: 500, height: 500}})

test('should be visible', async ({mount}) => {
  const component = await mount(<FormBuilderStory />)
  await expect(component).toBeVisible()
})
