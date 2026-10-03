import {describe, expect, it} from 'vitest'

import {type VistaPerspective} from '../store/types'
import {getEffectivePerspective} from './tabPerspective'

describe('getEffectivePerspective', () => {
  it('reads scheduled drafts as global where the workspace has no scheduled drafts', () => {
    expect(getEffectivePerspective('scheduledDrafts', false)).toBe('global')
    expect(getEffectivePerspective('scheduledDrafts', true)).toBe('scheduledDrafts')
  })

  it('leaves every other perspective alone', () => {
    const others: VistaPerspective[] = ['global', 'raw', 'published', 'drafts', undefined]
    for (const perspective of others) {
      expect(getEffectivePerspective(perspective, false)).toBe(perspective)
      expect(getEffectivePerspective(perspective, true)).toBe(perspective)
    }
  })
})
