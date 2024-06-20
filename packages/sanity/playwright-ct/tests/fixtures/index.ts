import {test as base} from '@playwright/experimental-ct-react'
import {mergeTests} from '@playwright/test'

import {test as copyPasteFixture} from './copyPasteFixture'

export const test = mergeTests(base, copyPasteFixture)

export {expect} from '@playwright/test'
