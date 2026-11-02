import {Card} from '@sanity/ui'
import {type ReactNode} from 'react'
import {Text, Container, Flex, VStack} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {variantsLocaleNamespace} from '../../i18n'

/**
 * The Variants overview page header: title, description and the page's primary `action`, with
 * `children` (banners) below it.
 *
 * @internal
 */
export function VariantsOverviewHeader({
  action,
  children,
}: {
  action: ReactNode
  children?: ReactNode
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)

  return (
    // Same container width as the releases document table (`container[3]`), so the page header
    // aligns with the table's row content below.
    <Container flexBasis="auto" flexGrow={0} flexShrink={0} size={3}>
      <Flex flexDirection="column" paddingX={3}>
        <Card flex="none" paddingBottom={4} paddingTop={5}>
          <Flex alignItems="flex-start" gap={4} justifyContent="space-between">
            <VStack gap={2}>
              <Text as="h1" size={4} weight="bold" trim={true}>
                {t('overview.title')}
              </Text>
              <Text muted size={1} as="div" trim={true}>
                {t('overview.description')}
              </Text>
            </VStack>
            {action}
          </Flex>
        </Card>
        {children}
      </Flex>
    </Container>
  )
}
