import {AddDocumentIcon} from '@sanity/icons/AddDocument'
import {Button, Card, Text} from '@sanity/ui'
import {useActiveWorkspace} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {usePresentationNavigate, usePresentationParams} from 'sanity/presentation'
import {useIntentLink} from 'sanity/router'
import {Flex, VStack} from 'ui5'

export function CustomNavigator(): React.JSX.Element {
  const navigate = usePresentationNavigate()
  const {preview} = usePresentationParams()
  const workspace = useActiveWorkspace()
  const studioBasePath = workspace?.activeWorkspace?.basePath || '/'

  const createPageIntent = useIntentLink({
    intent: 'create',
    params: {type: 'page', mode: 'presentation', preview},
  })

  return (
    <Card flex={1} height="fill">
      <Flex
        height="100%"
        flexDirection="column"
        justifyContent="space-between"
        flexBasis="0%"
        flexGrow={1}
      >
        <Flex padding={2} gap={1} flexDirection="column">
          <Card
            as="button"
            onClick={() => navigate('https://preview-kit-next-app-router.sanity.dev/')}
            padding={3}
            pressed={preview?.startsWith('https://preview-kit-next-app-router')}
            radius={2}
          >
            <VStack gap={2}>
              <Text size={0} muted>
                Next.js
              </Text>
              <Text>App Router</Text>
            </VStack>
          </Card>
          <Card
            as="button"
            onClick={() => navigate('https://preview-kit-next-pages-router.sanity.dev/')}
            padding={3}
            pressed={preview?.startsWith('https://preview-kit-next-pages-router')}
            radius={2}
          >
            <VStack gap={2}>
              <Text size={0} muted>
                Next.js
              </Text>
              <Text>Pages Router</Text>
            </VStack>
          </Card>
          <Card
            as="button"
            onClick={() => navigate('https://preview-kit-remix.sanity.dev/')}
            padding={3}
            pressed={preview?.startsWith('https://preview-kit-remix')}
            radius={2}
          >
            <Text>Remix</Text>
          </Card>
          <Card
            as="button"
            onClick={() => navigate('https://next.sanity.build/blog?q=2025')}
            padding={3}
            pressed={preview?.startsWith('https://next.sanity.build')}
            radius={2}
          >
            <Text>Blocked test</Text>
          </Card>
          <Card
            as="button"
            onClick={() => {
              const level1 = new URL(
                `${studioBasePath === '/' ? '' : studioBasePath}/presentation`,
                location.origin,
              )
              const level2 = new URL(level1, location.origin)
              level2.searchParams.set('preview', level1.toString())
              const level3 = new URL(level1, location.origin)
              level3.searchParams.set('preview', level2.toString())

              navigate(level3.toString())
            }}
            padding={3}
            pressed={preview?.startsWith(`${location.origin}${studioBasePath}`)}
            radius={2}
          >
            <Text>Recursion test</Text>
          </Card>
        </Flex>
        <Flex padding={2} gap={1} flexDirection="column">
          <Button
            icon={AddDocumentIcon}
            text="New Page"
            mode="ghost"
            onClick={createPageIntent.onClick}
            href={createPageIntent.href}
            as="a"
          />
        </Flex>
      </Flex>
    </Card>
  )
}
