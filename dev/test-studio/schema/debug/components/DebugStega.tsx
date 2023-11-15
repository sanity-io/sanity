/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-nested-ternary */
import {ContentSourceMap, ContentSourceMapDocuments, studioPath} from '@sanity/client/csm'
import {Box, Button, Card, Code, Label, Stack} from '@sanity/ui'
import {useMemo} from 'react'
import {InputProps, isDocumentSchemaType} from 'sanity'
import {useDocumentPane, usePaneRouter} from 'sanity/desk'
import {vercelStegaDecodeAll} from '@vercel/stega'
import {stegaEncodeSourceMap} from '@sanity/client/stega'
import styled from 'styled-components'

export function StegaDebugger(props: InputProps) {
  if (isDocumentSchemaType(props.schemaType)) {
    return (
      <Stack space={2}>
        <DocumentDebugger />
        {props.renderDefault(props)}
      </Stack>
    )
  }
  return (
    <Stack space={2}>
      {props.renderDefault(props)}
      <InputDebugger {...props} />
    </Stack>
  )
}

const HoverCard = styled(Card)`
  transition: opacity 100ms ease;
  &:hover {
    opacity: 0.1;
  }
  &:active {
    pointer-events: none;
  }
`
function DocumentDebugger() {
  const {focusPath} = useDocumentPane()
  // if (!focusPath || focusPath.length < 1) return null
  return (
    <HoverCard
      radius={2}
      shadow={2}
      padding={2}
      tone="default"
      style={{
        position: 'sticky',
        // right: 4,
        // top: 54,
        top: 2,
        zIndex: 9999999,
        background: 'white',
      }}
    >
      <Stack space={2}>
        <Label size={0}>current focus path</Label>
        <Box overflow="auto" padding={1}>
          <Code size={0}>{studioPath.toString(focusPath) || 'undefined'}</Code>
        </Box>
      </Stack>
    </HoverCard>
  )
}

function InputDebugger(props: InputProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value = props.value as any
  const paneRouter = usePaneRouter()
  const {
    documentId,
    documentType,
    // onFocus,
  } = useDocumentPane()
  const sourcePath = 'field'
  const resultSourceMap = useMemo(() => {
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
    const mappings = {
      [`$['${sourcePath}']`]: {
        source: {
          document: 0,
          path: 0,
          type: 'documentValue' as const,
        },
        type: 'value' as const,
      },
    }

    return {documents, paths, mappings} satisfies ContentSourceMap
  }, [documentId, documentType, props.path])
  const stegaResult = useMemo(
    () =>
      stegaEncodeSourceMap({[sourcePath]: value}, resultSourceMap, {
        enabled: true,
        studioUrl: '/stega',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any),
    [resultSourceMap, value],
  )
  const stegaEditLinks = useMemo(
    () => vercelStegaDecodeAll(JSON.stringify(stegaResult)),
    [stegaResult],
  )
  if (!stegaEditLinks || stegaEditLinks.length < 1) return null

  return (
    <Card padding={2} tone="default" border>
      <Stack space={4}>
        <Label size={0}>edit links that updates focus path</Label>
        <Box overflow="auto" padding={1}>
          <Stack space={2}>
            {stegaEditLinks?.map(({href}: any) => {
              const [, relativePath] = href.split('/intent/edit/')
              const [pathname] = relativePath.split('?')
              const prettyPath = new URLSearchParams(pathname.split(';').join('&')).get('path')

              return (
                <Button
                  as="a"
                  key={href}
                  href={href}
                  tone="primary"
                  size={0}
                  fontSize={0}
                  padding={2}
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={(event) => {
                    if (prettyPath) {
                      event.preventDefault()
                      paneRouter.setParams({...paneRouter.params, path: prettyPath})
                      // onFocus(studioPath.fromString(prettyPath))
                    }
                  }}
                >
                  <Code size={0}>{prettyPath || href}</Code>
                </Button>
              )
            })}
          </Stack>
        </Box>
      </Stack>
    </Card>
  )
}
