import {Card, Stack, Text} from '@sanity/ui'
import {LocaleProvider} from 'sanity'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type PaneRouterContextValue} from '../../paneRouter/types'
import {PaneRouterContext} from '../../paneRouter/usePaneRouter'
import {PaneItem} from '../PaneItem'

const NOOP = () => undefined

const paneRouterContextValue: PaneRouterContextValue = {
  index: 0,
  groupIndex: 0,
  siblingIndex: 0,
  payload: undefined,
  params: {},
  hasGroupSiblings: false,
  groupLength: 1,
  routerPanesState: [],
  ChildLink: ({children}) => <>{children}</>,
  ReferenceChildLink: ({children}) => <>{children}</>,
  handleEditReference: NOOP,
  ParameterizedLink: () => null,
  replaceCurrent: NOOP,
  closeCurrent: NOOP,
  closeCurrentAndAfter: NOOP,
  duplicateCurrent: NOOP,
  setView: NOOP,
  setParams: NOOP,
  setPayload: NOOP,
  createPathWithParams: () => '',
  navigateIntent: NOOP,
}

const TRUNCATING_TITLE =
  'A document type with a title long enough to run out of room beside its count badge'

const CASES = [
  {label: 'no count', title: 'Author'},
  {label: 'resolved zero', title: 'Author', count: 0},
  {label: 'single digit', title: 'Author', count: 7},
  {label: 'group separators', title: 'Species', count: 32145},
  {label: 'title truncates beside the badge', title: TRUNCATING_TITLE, count: 1088},
]

/**
 * Chromatic sentinel for the list-pane count badge: badge-to-chevron spacing, baseline
 * alignment against the title, and how a long title truncates beside a badge. The jsdom
 * tests assert badge text only, and runtime styles are disabled there.
 *
 * `TestWrapper` mounts no locale provider, so `PaneItem`'s `useNumberFormat` throws without
 * this `LocaleProvider`.
 */
export function PaneItemStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <LocaleProvider>
        <PaneRouterContext.Provider value={paneRouterContextValue}>
          <Card padding={4} style={{maxWidth: 360}}>
            <Stack gap={5}>
              {CASES.map(({label, title, count}) => (
                <Stack gap={2} key={label}>
                  <Text muted size={1} weight="medium">
                    {label}
                  </Text>
                  <PaneItem id={label} title={title} count={count} />
                </Stack>
              ))}
            </Stack>
          </Card>
        </PaneRouterContext.Provider>
      </LocaleProvider>
    </TestWrapper>
  )
}
