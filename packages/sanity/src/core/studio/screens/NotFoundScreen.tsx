/* oxlint-disable i18next/no-literal-string,@sanity/i18n/no-attribute-string-literals */
import {Card, Heading, Inline} from '@sanity/ui'
import {VStack,Flex} from 'ui5'

import {Button} from '../../../ui-components/button/Button'

export function NotFoundScreen(props: {onNavigateToDefaultWorkspace: () => void}) {
  return (
    <Card height="fill" sizing="border" tone="caution" display="flex">
      <Flex
        flexDirection="row"
        justifyContent="center"
        flexBasis="0%"
        flexGrow={1}
        alignItems="center"
      >
        <VStack gap={4}>
          <Heading as="h1">Workspace not found</Heading>
          <Inline>
            <Button
              text="Go to default workspace"
              onClick={props.onNavigateToDefaultWorkspace}
              mode="ghost"
            />
          </Inline>
        </VStack>
      </Flex>
    </Card>
  )
}
