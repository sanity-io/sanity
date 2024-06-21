import {test as base} from '@playwright/experimental-ct-react'
import {mergeTests} from '@playwright/test'

import {test as copyPasteFixture} from './copyPasteFixture'
import {test as scrollToTopFixture} from './scrollToTopFixture'

export const test = mergeTests(base, copyPasteFixture, scrollToTopFixture)

export {expect} from '@playwright/test'
