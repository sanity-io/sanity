import {type ContentSourceMap, type ContentSourceMapDocuments, studioPath} from '@sanity/client/csm'
import {stegaEncodeSourceMap} from '@sanity/client/stega'
import {ComposeIcon, LockIcon, MasterDetailIcon, TargetIcon, UnlockIcon} from '@sanity/icons'
import {Box, Button, Card, Code, Inline, Label, Stack, Text} from '@sanity/ui'
import {vercelStegaDecodeAll} from '@vercel/stega'
import {createContext, startTransition, use, useEffect, useState} from 'react'
import {type InputProps, isDocumentSchemaType, type Path, usePerspective} from 'sanity'
import {useDocumentPane, usePaneRouter} from 'sanity/structure'

/**
 * There should only be a single DocumentDebugger in the tree, but if there's a recursive field at play the context lets us know that
 * we can skip rendering additional DocumentDebuggers.
 */
const StegaDocumentDebuggerContext = createContext(false)

export function StegaDebugger(props: InputProps) {
  if (isDocumentSchemaType(props.schemaType)) {
    if (use(StegaDocumentDebuggerContext)) return props.renderDefault(props)
    return (
      <Stack space={2}>
        <DocumentDebugger />
        <StegaDocumentDebuggerContext value>
          {props.renderDefault(props)}
        </StegaDocumentDebuggerContext>
      </Stack>
    )
  }
  return (
    <Stack space={1}>
      <InputDebugger {...props} />
      {props.renderDefault(props)}
    </Stack>
  )
}

const focusPathHistory = new Set<Path>()
function DocumentDebugger() {
  const {focusPath} = useDocumentPane()
  const [sticky, setSticky] = useState(true)
  useEffect(() => {
    const before = focusPathHistory.size
    focusPathHistory.add(focusPath)
    const after = focusPathHistory.size
    if (after !== before) {
      console.groupCollapsed(`focusPath changed (${focusPathHistory.size} times in total)`)
      // loop over set and grab the last 10 items
      const last10Items = Array.from(focusPathHistory, (path) => ({
        focusPath: studioPath.toString(path),
        value: path,
      }))
      console.table(last10Items)
      console.groupEnd()
    }
  }, [focusPath])
  return (
    <Card
      radius={2}
      shadow={sticky ? 2 : 1}
      padding={2}
      tone="default"
      style={{
        position: sticky ? 'sticky' : 'relative',
        // right: 4,
        // top: 54,
        top: sticky ? 2 : 0,
        zIndex: 9999999,
        background: 'white',
      }}
    >
      <Stack space={2}>
        <Label size={0}>current focus path</Label>
        <Box overflow="auto" paddingY={1}>
          <Code size={0}>{studioPath.toString(focusPath) || 'undefined'}</Code>
        </Box>
        <Text size={0} muted>
          Check browser console for focus path history
        </Text>
        <Button
          radius={1}
          icon={sticky ? UnlockIcon : LockIcon}
          mode="bleed"
          size={0}
          fontSize={0}
          paddingX={2}
          paddingY={1}
          space={1}
          text={sticky ? 'Unstick' : 'Stick'}
          onClick={() => startTransition(() => setSticky((prev) => !prev))}
          style={{position: 'absolute', bottom: 1, right: 1}}
        />
      </Stack>
    </Card>
  )
}

const skipStega = new Set(['_type', '_id', '_key', '_ref'])
function InputDebugger(props: InputProps) {
  const value = props.value as any
  const paneRouter = usePaneRouter()
  const perspective = usePerspective()
  const {documentId, documentType} = useDocumentPane()
  const documents = [
    {_id: documentId, _type: documentType} satisfies ContentSourceMapDocuments[number],
  ]
  const paths = [
    `${props.path
      .map((segment) =>
        typeof segment === 'string'
          ? `['${segment}']`
          : typeof segment === 'object' &&
              !Array.isArray(segment) &&
              typeof segment?._key === 'string'
            ? `[?(@._key=='${segment._key}')]`
            : undefined,
      )
      .filter(Boolean)
      .join('')}`,
  ]
  const sourcePath = 'field'
  const key = `$['${sourcePath}']`
  const mappings = {
    [key]: {
      source: {
        document: 0,
        path: 0,
        type: 'documentValue' as const,
      },
      type: 'value' as const,
    },
  }
  const resultSourceMap = {documents, paths, mappings} satisfies ContentSourceMap
  const stegaResult = stegaEncodeSourceMap({[sourcePath]: value}, resultSourceMap, {
    enabled: true,
    studioUrl: '/stega',
    // @ts-expect-error - .at(-1) exists on arrays, update tsconfig to allow
    filter: ({sourcePath: path}) => !skipStega.has(path.at(-1)),
  })
  const stegaEditLinks = vercelStegaDecodeAll(JSON.stringify(stegaResult))
  const resolvedPath = studioPath.toString(props.path)
  if (!resolvedPath) return null

  return (
    <Card padding={2} tone="transparent" border radius={2}>
      <Stack space={3}>
        <Stack space={2}>
          <Label size={0} muted>
            Field path
          </Label>
          <Box overflow="auto" paddingY={1}>
            <Code size={0}>{resolvedPath}</Code>
          </Box>
        </Stack>
        {stegaEditLinks && stegaEditLinks.length > 0 && (
          <Stack space={2}>
            <Label size={0}>Stega content links</Label>
            {stegaEditLinks?.map(({href}: any) => {
              const [, relativePath] = href.split('/intent/edit/')
              const [pathname] = relativePath.split('?')
              const prettyPath = new URLSearchParams(pathname.split(';').join('&')).get('path')
              const [url, search] = href.split('?')
              const searchParams = new URLSearchParams(search)
              if (perspective.selectedPerspectiveName) {
                searchParams.set('perspective', perspective.selectedPerspectiveName)
              } else {
                // If no perspective is selected, then whatever perspective is already in the URL should be removed as it's likely wrong
                searchParams.delete('perspective')
              }
              // Prevent Presentation from openign the Studio in the preview frame
              searchParams.set('preview', '/preview/index.html')

              const hrefWithPerspective = `${url}?${searchParams}`

              return (
                <Stack key={href} space={0}>
                  {prettyPath !== resolvedPath && (
                    <Box overflow="auto" paddingY={1}>
                      {prettyPath?.startsWith(resolvedPath) ? (
                        <>
                          <Code size={0}>
                            <span style={{opacity: 0.6}}>{resolvedPath}</span>
                            {prettyPath.slice(resolvedPath.length)}
                          </Code>
                        </>
                      ) : (
                        <Code size={0}>{prettyPath}</Code>
                      )}
                    </Box>
                  )}
                  <Inline space={1}>
                    <Button
                      // as="a"
                      // href={href}
                      icon={TargetIcon}
                      tone="primary"
                      size={0}
                      fontSize={0}
                      padding={2}
                      onClick={(event) => {
                        if (prettyPath) {
                          event.preventDefault()
                          startTransition(() =>
                            paneRouter.setParams({...paneRouter.params, path: prettyPath}),
                          )
                        }
                      }}
                      text="Focus path"
                    />
                    <Button
                      as="a"
                      href={hrefWithPerspective}
                      target="_blank"
                      icon={ComposeIcon}
                      tone="neutral"
                      size={0}
                      fontSize={0}
                      padding={2}
                      text="Open in Presentation"
                    />
                    <Button
                      as="a"
                      href={hrefWithPerspective.replace('mode=presentation;', '')}
                      target="_blank"
                      icon={MasterDetailIcon}
                      tone="neutral"
                      size={0}
                      fontSize={0}
                      padding={2}
                      text="Open in Structure"
                    />
                  </Inline>
                </Stack>
              )
            })}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
