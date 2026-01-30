import {LaunchIcon} from '@sanity/icons'
import {Box, Button, Card, Code, Container, Flex, Heading, Stack, Text, TextInput} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {useWorkspace} from 'sanity'
import {useRouter} from 'sanity/router'

// Available workspaces in test-studio (from sanity.config.ts)
const WORKSPACES = [
  {name: 'default', basePath: '/test', dataset: 'test'},
  {name: 'us', basePath: '/us', dataset: 'test-us'},
  {name: 'playground', basePath: '/playground', dataset: 'playground'},
  {name: 'partialIndexing', basePath: '/partial-indexing', dataset: 'partial-indexing-2'},
  {name: 'custom-components', basePath: '/custom-components', dataset: 'test'},
  {name: 'staging', basePath: '/staging', dataset: 'playground'},
  {name: 'no-releases', basePath: '/no-releases', dataset: 'no-releases'},
]

/**
 * Helper to build an intent URL for a different workspace
 */
function buildCrossWorkspaceIntentUrl(
  targetBasePath: string,
  intentName: string,
  params: Record<string, string | undefined>,
): string {
  const paramString = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join(';')

  return `${targetBasePath}/intent/${intentName}/${paramString}/`
}

export function CrossWorkspaceNavigationTest() {
  const workspace = useWorkspace()
  const router = useRouter()
  const [documentId, setDocumentId] = useState('grrm')
  const [documentType, setDocumentType] = useState('author')

  const handleNavigateToWorkspace = useCallback(
    (targetBasePath: string) => {
      const url = buildCrossWorkspaceIntentUrl(targetBasePath, 'edit', {
        id: documentId,
        type: documentType,
      })
      // Use navigateUrl to navigate across workspaces
      router.navigateUrl({path: url})
    },
    [router, documentId, documentType],
  )

  const currentWorkspace = WORKSPACES.find((w) => w.basePath === workspace.basePath)
  const otherWorkspaces = WORKSPACES.filter((w) => w.basePath !== workspace.basePath)

  return (
    <Container width={2} padding={4}>
      <Stack space={5}>
        <Heading as="h1" size={3}>
          Cross-Workspace Navigation Test
        </Heading>

        {/* Current Workspace Info */}
        <Card padding={4} radius={2} shadow={1} tone="primary">
          <Stack space={3}>
            <Text weight="bold" size={2}>
              Current Workspace
            </Text>
            <Code language="json">
              {JSON.stringify(
                {
                  name: workspace.name,
                  basePath: workspace.basePath,
                  dataset: workspace.dataset,
                },
                null,
                2,
              )}
            </Code>
          </Stack>
        </Card>

        {/* Document Configuration */}
        <Card padding={4} radius={2} shadow={1}>
          <Stack space={4}>
            <Text weight="bold" size={2}>
              Target Document (for edit intent)
            </Text>
            <Flex gap={3}>
              <Box flex={1}>
                <Stack space={2}>
                  <Text size={1} muted>
                    Document ID
                  </Text>
                  <TextInput
                    value={documentId}
                    onChange={(e) => setDocumentId(e.currentTarget.value)}
                  />
                </Stack>
              </Box>
              <Box flex={1}>
                <Stack space={2}>
                  <Text size={1} muted>
                    Document Type
                  </Text>
                  <TextInput
                    value={documentType}
                    onChange={(e) => setDocumentType(e.currentTarget.value)}
                  />
                </Stack>
              </Box>
            </Flex>
            <Text size={1} muted>
              Try using "grrm" / "author" or any document ID that exists in the target workspace's
              dataset.
            </Text>
          </Stack>
        </Card>

        {/* Navigation Buttons */}
        <Card padding={4} radius={2} shadow={1}>
          <Stack space={4}>
            <Text weight="bold" size={2}>
              Navigate to Other Workspaces
            </Text>
            <Text size={1} muted>
              Click a button to navigate to that workspace with an edit intent for the document
              above. This uses <code>router.navigateUrl()</code> to perform a cross-workspace
              navigation.
            </Text>
            <Stack space={2}>
              {otherWorkspaces.map((ws) => {
                const intentUrl = buildCrossWorkspaceIntentUrl(ws.basePath, 'edit', {
                  id: documentId,
                  type: documentType,
                })
                return (
                  <Flex key={ws.name} gap={3} align="center">
                    <Box flex={1}>
                      <Button
                        mode="ghost"
                        text={`${ws.name} (${ws.basePath})`}
                        icon={LaunchIcon}
                        onClick={() => handleNavigateToWorkspace(ws.basePath)}
                        style={{width: '100%', justifyContent: 'flex-start'}}
                      />
                    </Box>
                    <Box flex={2}>
                      <Code size={0}>{intentUrl}</Code>
                    </Box>
                  </Flex>
                )
              })}
            </Stack>
          </Stack>
        </Card>

        {/* Direct Links */}
        <Card padding={4} radius={2} shadow={1}>
          <Stack space={4}>
            <Text weight="bold" size={2}>
              Direct Links (open in same tab)
            </Text>
            <Text size={1} muted>
              These are regular anchor links - clicking will navigate directly.
            </Text>
            <Stack space={2}>
              {otherWorkspaces.map((ws) => {
                const intentUrl = buildCrossWorkspaceIntentUrl(ws.basePath, 'edit', {
                  id: documentId,
                  type: documentType,
                })
                return (
                  <a
                    key={ws.name}
                    href={intentUrl}
                    style={{
                      color: 'inherit',
                      textDecoration: 'underline',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5em',
                    }}
                  >
                    <LaunchIcon />
                    {ws.name} → {intentUrl}
                  </a>
                )
              })}
            </Stack>
          </Stack>
        </Card>

        {/* Usage Instructions */}
        <Card padding={4} radius={2} shadow={1} tone="caution">
          <Stack space={3}>
            <Text weight="bold" size={2}>
              How Cross-Workspace Navigation Works
            </Text>
            <Stack space={2}>
              <Text size={1}>
                1. Each workspace has its own <code>basePath</code> (e.g., /test, /playground)
              </Text>
              <Text size={1}>
                2. <code>navigateIntent()</code> only works within the current workspace
              </Text>
              <Text size={1}>
                3. To navigate across workspaces, construct the full intent URL with the target
                workspace's basePath
              </Text>
              <Text size={1}>
                4. Use <code>router.navigateUrl(&#123;path: url&#125;)</code> or a regular anchor
                link
              </Text>
              <Text size={1}>
                5. The intent format is: <code>/basePath/intent/intentName/params/</code>
              </Text>
            </Stack>
          </Stack>
        </Card>

        {/* Code Example */}
        <Card padding={4} radius={2} shadow={1}>
          <Stack space={3}>
            <Text weight="bold" size={2}>
              Code Example
            </Text>
            <Code language="typescript">
              {`// Build cross-workspace intent URL
const url = \`\${targetBasePath}/intent/edit/id=\${docId};type=\${docType}/\`

// Navigate using the router
router.navigateUrl({ path: url })

// Or use as a link href
<a href={url}>Go to document</a>`}
            </Code>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
