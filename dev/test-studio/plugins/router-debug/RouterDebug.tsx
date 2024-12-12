import {createPreviewSecret} from '@sanity/preview-url-secret/create-secret'
import {Button, Card, Code, Flex, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import {IntentLink, RouteScope, StateLink, useRouter, useStateLink} from 'sanity/router'

export function RouterDebug() {
  const {navigate} = useRouter()

  const link = useStateLink({
    state: {
      section: 'abc',
      _searchParams: [['viewParam', 'from link']],
    },
  })

  const client = useClient({apiVersion: '2024-12-12'})

  return (
    <Card sizing="border" padding={5}>
      <Flex>
        <Stack space={4}>
          <Button onClick={() => createPreviewSecret(client, 'test-studio', location.href)}>
            Create Secret
          </Button>

          <StateLink state={{}}>Tool home</StateLink>
          <StateLink
            state={{
              section: 'abc',
              _searchParams: [
                ['someSearchParam', 'yes'],
                ['emojis', '🤩🤷🎉🫧'],
                ['🧭', '🔜'],
              ],
            }}
          >
            Go to section "abc", with search params
          </StateLink>

          <IntentLink
            intent="router-debug-please"
            params={{
              favorite: 'capybara',
            }}
          >
            Resolve intent
          </IntentLink>
          <Button
            onClick={() => {
              navigate({
                section: 'buttons',
                _searchParams: [['from-button', 'true']],
              })
            }}
            mode="ghost"
            text="A button navigating w/search param"
          />
          <a {...link}>A regular link</a>

          <Card shadow={1} padding={3} radius={2}>
            <RouteScope scope="some-plugin">
              <Stack space={3}>
                <Text weight="semibold">A (scoped) plugin</Text>

                <StateLink
                  state={{
                    pluginParam: 'hello-from-plugin',
                    _searchParams: [['somePluginParam', 'hi!']],
                  }}
                >
                  Click to navigate to a plugin param
                </StateLink>
                <InspectRouterState />
              </Stack>
            </RouteScope>
          </Card>
          <Card shadow={1} padding={3} radius={2}>
            <InspectRouterState />
          </Card>
        </Stack>
      </Flex>
    </Card>
  )
}

function InspectRouterState() {
  const {state} = useRouter()
  return (
    <Stack space={3}>
      <Text weight="semibold">Decoded router state</Text>
      <Code language="json" size={1}>
        {JSON.stringify(state, null, 2)}
      </Code>
    </Stack>
  )
}
