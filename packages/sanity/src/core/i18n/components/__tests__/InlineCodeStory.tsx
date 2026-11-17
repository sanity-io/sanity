import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {defineLocaleResourceBundle} from '../../helpers'
import {useTranslation} from '../../hooks/useTranslation'
import {Translate} from '../../Translate'
import {InlineCode} from '../InlineCode'

const NAMESPACE = 'inline-code-story'

const BUNDLE = defineLocaleResourceBundle({
  locale: 'en-US',
  namespace: NAMESPACE,
  resources: {
    'with-code': 'Set <code>projectId</code> and <code>dataset</code> in your Studio config.',
  },
})

function TranslatedRow() {
  const {t} = useTranslation(NAMESPACE)
  return (
    <Text size={1} as="div" trim={true}>
      <Translate t={t} i18nKey="with-code" components={{code: InlineCode}} />
    </Text>
  )
}

/**
 * Chromatic sentinel for `InlineCode`: inline within translated copy through
 * `Translate`'s components map, and used directly as children of `Text`.
 */
export function InlineCodeStory() {
  return (
    <TestWrapper i18nBundles={[BUNDLE]} schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              translate components
            </Text>
            <TranslatedRow />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              standalone
            </Text>
            <Text size={1} as="div" trim={true}>
              Delegate errors with <InlineCode>useStudioErrorHandler()</InlineCode> or catch them
              locally.
            </Text>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
