import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {DiffErrorBoundary} from '../DiffErrorBoundary'

function ThrowingPreview(): never {
  throw new Error("Cannot read properties of undefined (reading 'title')")
}

function CaughtDiff() {
  const {t} = useTranslation()
  return (
    <DiffErrorBoundary t={t}>
      <ThrowingPreview />
    </DiffErrorBoundary>
  )
}

/**
 * Chromatic sentinel for the review-changes error boundary after the ui5
 * Flex / Icon / Text migration. Critical Card tone plus stacked title and
 * developer-info depend on Flex gap — a mix TypeScript will not catch.
 * Copy is studio-locale fixture only (no live diff).
 */
export function DiffErrorBoundaryStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            caught render error
          </Text>
          <CaughtDiff />
        </VStack>
      </Card>
    </TestWrapper>
  )
}
