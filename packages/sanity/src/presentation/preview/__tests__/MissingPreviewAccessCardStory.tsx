import {type Role} from '@sanity/types'
import {Card, Stack} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {LocaleProvider} from 'sanity'
import {Text} from 'ui5'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {presentationUsEnglishLocaleBundle} from '../../i18n'
import {MissingPreviewAccessCard} from '../MissingPreviewAccessCard'

const FRAME_STYLE = {height: 240}

const VIEWER: Role = {name: 'viewer', title: 'Viewer'}
const CUSTOM_ROLE: Role = {name: 'custom-role', title: ''}

/**
 * Chromatic sentinel for Presentation's missing-preview-access chrome. The
 * card is a titled ErrorCard with a critical continue-without-drafts action
 * and role-aware copy via list format — a mix TypeScript will not catch,
 * and ErrorCard's own story does not import this wrapper. Roles are fixtures
 * (no live user).
 */
export function MissingPreviewAccessCardStory() {
  return (
    <TestWrapper i18nBundles={[presentationUsEnglishLocaleBundle]} schemaTypes={[]}>
      <LocaleProvider>
        <Card padding={4}>
          <Stack gap={5}>
            <Stack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                named roles
              </Text>
              <div style={FRAME_STYLE}>
                <MissingPreviewAccessCard onContinueAnyway={noop} roles={[VIEWER, CUSTOM_ROLE]} />
              </div>
            </Stack>
            <Stack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                no roles
              </Text>
              <div style={FRAME_STYLE}>
                <MissingPreviewAccessCard onContinueAnyway={noop} roles={undefined} />
              </div>
            </Stack>
          </Stack>
        </Card>
      </LocaleProvider>
    </TestWrapper>
  )
}
