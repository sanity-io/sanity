import {type LayoutProps, definePlugin} from 'sanity'
import {StyleSheetManager, type IStyleSheetContext} from 'styled-components'
import isValid from '@emotion/is-prop-valid'
import {useCallback, useState, startTransition} from 'react'
import {Card, Box, Code, Flex, Button, Stack, Text} from '@sanity/ui'
import {useHotModuleReload} from 'use-hot-module-reload'

// Ensures that transient prop warnings aren't forgotten and spam userland `sanity dev`
export const styledComponentsPlugin = definePlugin({
  name: 'styled-components-plugin',
  studio: {components: {layout: StyleSheetManagerDebugger}},
})

function StyleSheetManagerDebugger(props: LayoutProps) {
  const [error, setError] = useState<Error | null>(null)
  const handleResetError = useCallback(() => startTransition(() => setError(null)), [])
  const shouldForwardProp = useCallback<
    Exclude<IStyleSheetContext['shouldForwardProp'], undefined>
  >((key, elementToBeCreated) => {
    if (!seen.has(key) && domElements.has(elementToBeCreated as any) && !isValid(key)) {
      seen.add(key)
      const message = `it looks like an unknown prop "${key}" is being sent through to the DOM,
which will likely trigger a React console error.
Consider using transient props (\`$\` prefix for automatic filtering,
or use the \`shouldForwardProp\` API on the parent styled component that is setting the prop:
https://styled-components.com/docs/api#shouldforwardprop`
      const nextError = new TypeError(
        message,
        // @ts-expect-error -- this is supported but missing in the core types
        {cause: elementToBeCreated},
      )
      console.error(nextError)
      startTransition(() => setError(nextError))
    }
    return true
  }, [])

  const handleHotReset = useCallback(() => {
    seen.clear()
    handleResetError()
  }, [handleResetError])
  useHotModuleReload(handleHotReset)

  if (error) {
    const {name, message, stack} = error
    return (
      <Flex align="center" direction="column" height="fill" justify="center">
        <Stack space={3} padding={3}>
          <Card tone="critical" padding={3}>
            <Flex direction="column" gap={2}>
              <Text weight="medium" size={3}>
                {name}
              </Text>
            </Flex>

            <Card tone="critical" overflow="auto" padding={4}>
              <Code>{message}</Code>
            </Card>

            {stack && (
              <details open>
                <Text as="summary">Stack Trace</Text>

                <Box overflow="auto" marginTop={4}>
                  <Code>{stack}</Code>
                </Box>
              </details>
            )}
          </Card>
          <Button tone="caution" onClick={handleResetError} text="Ignore and continue" />
        </Stack>
      </Flex>
    )
  }

  return (
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      {props.renderDefault(props)}
    </StyleSheetManager>
  )
}

const seen = new Set<string>()

// Based on styled-components source: https://github.com/styled-components/styled-components/blob/22e8b7f233e12500a68be4268b1d79c5d7f2a661/packages/styled-components/src/utils/domElements.ts#L3-L139
// Used to generate the easy-to-miss warning: https://github.com/styled-components/styled-components/blob/22e8b7f233e12500a68be4268b1d79c5d7f2a661/packages/styled-components/src/models/StyledComponent.ts#L162-L164
const elements = [
  'a',
  'abbr',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'bdi',
  'bdo',
  'big',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'html',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'keygen',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'menu',
  'menuitem',
  'meta',
  'meter',
  'nav',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'param',
  'picture',
  'pre',
  'progress',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'script',
  'section',
  'select',
  'small',
  'source',
  'span',
  'strong',
  'style',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'tr',
  'track',
  'u',
  'ul',
  'use',
  'var',
  'video',
  'wbr', // SVG
  'circle',
  'clipPath',
  'defs',
  'ellipse',
  'foreignObject',
  'g',
  'image',
  'line',
  'linearGradient',
  'marker',
  'mask',
  'path',
  'pattern',
  'polygon',
  'polyline',
  'radialGradient',
  'rect',
  'stop',
  'svg',
  'text',
  'tspan',
] as const
const domElements = new Set(elements)
