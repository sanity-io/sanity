/* eslint-disable react/jsx-no-bind */
import {AddDocumentIcon} from '@sanity/icons'
import {Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {useActiveWorkspace} from 'sanity'
import {usePresentationNavigate, usePresentationParams} from 'sanity/presentation'
import {useIntentLink} from 'sanity/router'

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
      <Flex height="fill" direction="column" justify="space-between" flex={1}>
        <Stack padding={2} space={1}>
          <Card
            as="button"
            onClick={() => navigate('https://preview-kit-next-app-router.sanity.dev/')}
            padding={3}
            pressed={preview?.startsWith('https://preview-kit-next-app-router')}
            radius={2}
          >
            <Stack space={2}>
              <Text size={0} muted>
                Next.js
              </Text>
              <Text>App Router</Text>
            </Stack>
          </Card>
          <Card
            as="button"
            onClick={() => navigate('https://preview-kit-next-pages-router.sanity.dev/')}
            padding={3}
            pressed={preview?.startsWith('https://preview-kit-next-pages-router')}
            radius={2}
          >
            <Stack space={2}>
              <Text size={0} muted>
                Next.js
              </Text>
              <Text>Pages Router</Text>
            </Stack>
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
        </Stack>
        <Stack padding={2} space={1}>
          <Button
            icon={AddDocumentIcon}
            text="New Page"
            mode="ghost"
            // eslint-disable-next-line react/jsx-handler-names
            onClick={createPageIntent.onClick}
            href={createPageIntent.href}
            as="a"
          />
        </Stack>
      </Flex>
    </Card>
  )
}
