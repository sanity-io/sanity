import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type FormFieldGroup} from '../../../store/types/fieldGroup'
import {FieldGroupTabs} from './FieldGroupTabs'

const groups: FormFieldGroup[] = [
  {
    name: 'content',
    title: 'Content',
    selected: true,
    fields: [],
  },
  {
    name: 'settings',
    title: 'Settings',
    fields: [],
  },
]

// `FieldGroupTabs` switches between the tab list and the select with an
// `ElementQuery`, which measures the element's own width against the theme's
// `media` breakpoints — not the viewport. Give each case its own container
// width (the first breakpoint is 360px) so neither depends on the ambient
// viewport, and so neither has to mutate it for the rest of the run.
function Harness({width}: {width: number}) {
  return (
    <TestWrapper schemaTypes={[]}>
      <div style={{width}}>
        <FieldGroupTabs groups={groups} path={[]} shouldAutoFocus={false} />
      </div>
    </TestWrapper>
  )
}

describe('FieldGroupTabs', () => {
  it('shows tabs when the container is wider than the first breakpoint', async () => {
    await render(<Harness width={800} />)

    await expect.element(page.getByTestId('field-group-tabs')).toBeVisible()
    await expect.element(page.getByTestId('field-group-select')).not.toBeVisible()
  })

  it('shows the select when the container is narrower than the first breakpoint', async () => {
    await render(<Harness width={320} />)

    await expect.element(page.getByTestId('field-group-tabs')).not.toBeVisible()
    await expect.element(page.getByTestId('field-group-select')).toBeVisible()
  })
})
