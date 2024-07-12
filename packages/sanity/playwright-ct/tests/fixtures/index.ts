import {test as base} from '@playwright/experimental-ct-react'
import {mergeTests} from '@playwright/test'

import {test as copyPasteFixture} from './copyPasteFixture'
import {test as debugFixture} from './debugFixture'
import {test as scrollToTopFixture} from './scrollToTopFixture'

export const test = mergeTests(base, copyPasteFixture, scrollToTopFixture, debugFixture)

export {expect} from '@playwright/test'
