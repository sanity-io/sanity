// oxlint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/vitest'
// Fail tests during which react-dom reports a prop leaking onto a DOM element
// oxlint-disable-next-line import/no-unassigned-import
import '@repo/test-config/vitest/failOnReactDomPropWarnings'

import {cleanup} from '@testing-library/react'
import {afterEach} from 'vitest'

afterEach(() => cleanup())
