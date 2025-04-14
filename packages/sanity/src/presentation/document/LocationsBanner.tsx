import {
  ChevronRightIcon,
  DesktopIcon,
  ErrorOutlineIcon,
  InfoOutlineIcon,
  WarningOutlineIcon,
} from '@sanity/icons'
import {Box, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {type ComponentType, type ReactNode, useCallback, useContext, useState} from 'react'
import {type ObjectSchemaType, useTranslation} from 'sanity'
import {PresentationContext} from 'sanity/_singletons'
import {useIntentLink} from 'sanity/router'

import {DEFAULT_TOOL_NAME, DEFAULT_TOOL_TITLE} from '../constants'
import {presentationLocaleNamespace} from '../i18n'
import {
  type DocumentLocation,
  type DocumentLocationsState,
  type PresentationPluginOptions,
} from '../types'
import {useCurrentPresentationToolName} from './useCurrentPresentationToolName'

const TONE_ICONS: Record<'positive' | 'caution' | 'critical', ComponentType> = {
  positive: InfoOutlineIcon,
  caution: WarningOutlineIcon,
  critical: ErrorOutlineIcon,
}

export function LocationsBanner(props: {
  documentId: string
  isResolving: boolean
  options: PresentationPluginOptions
  schemaType: ObjectSchemaType
  showPresentationTitle: boolean
  state: DocumentLocationsState
}): ReactNode {
  const {documentId, isResolving, options, schemaType, showPresentationTitle} = props
  const {locations, message, tone} = props.state
  const len = locations?.length || 0

  const {t} = useTranslation(presentationLocaleNamespace)
  const presentation = useContext(PresentationContext)
  const presentationName = presentation?.name
  const [expanded, setExpanded] = useState(false)
  const toggle = useCallback(() => {
    if (!len) return
    setExpanded((v) => !v)
  }, [len])

  const title = isResolving
    ? t('locations-banner.resolving.text')
    : message || t('locations-banner.locations-count', {count: len})

  const ToneIcon = tone ? TONE_ICONS[tone] : undefined

  return (
    <Card padding={1} radius={2} border tone={tone}>
      <div style={{margin: -1}}>
        {!locations && (
          <Flex align="flex-start" gap={3} padding={3}>
            {tone && ToneIcon && (
              <Box flex="none">
                <Text size={1}>
                  <ToneIcon />
                </Text>
              </Box>
            )}
            <Box flex={1}>
              <Text size={1} weight="medium">
                {showPresentationTitle && <>{options.title || DEFAULT_TOOL_TITLE} &middot; </>}
                {title}
              </Text>
            </Box>
          </Flex>
        )}
        {locations && (
          <>
            <Card
              as={len ? 'button' : undefined}
              onClick={toggle}
              padding={3}
              radius={1}
              tone="inherit"
            >
              <Flex gap={3}>
                <Box flex="none">
                  {isResolving ? (
                    <Spinner size={1} />
                  ) : (
                    <Text size={1}>
                      {len === 0 ? (
                        <InfoOutlineIcon />
                      ) : (
                        <ChevronRightIcon
                          style={{
                            transform: `rotate(${expanded ? '90deg' : 0})`,
                            transition: 'transform 100ms ease-in-out',
                          }}
                        />
                      )}
                    </Text>
                  )}
                </Box>
                <Box flex={1}>
                  <Text size={1} weight="medium">
                    {showPresentationTitle && <>{options.title || DEFAULT_TOOL_TITLE} &middot; </>}
                    {title}
                  </Text>
                </Box>
              </Flex>
            </Card>
            <Stack hidden={!expanded} marginTop={1} space={1}>
              {locations.map((l) => {
                let active = false
                if (
                  (options.name || DEFAULT_TOOL_NAME) === presentationName &&
                  presentation?.params.preview
                ) {
                  active = areUrlsMatching(presentation.params.preview, l.href)
                }

                return (
                  <LocationItem
                    active={active}
                    documentId={documentId}
                    documentType={schemaType.name}
                    key={l.href}
                    node={l}
                    toolName={options.name || DEFAULT_TOOL_NAME}
                  />
                )
              })}
            </Stack>
          </>
        )}
      </div>
    </Card>
  )
}

function LocationItem(props: {
  active: boolean
  documentId: string
  documentType: string
  node: DocumentLocation
  toolName: string
}) {
  const {documentId, documentType, node, active, toolName} = props
  const presentation = useContext(PresentationContext)
  const currentPresentationToolName = useCurrentPresentationToolName()
  const isCurrentTool = toolName === currentPresentationToolName
  const navigate = presentation?.navigate

  const presentationLinkProps = useIntentLink({
    intent: 'edit',
    params: {
      id: documentId,
      type: documentType,
      mode: 'presentation',
      presentation: toolName,
      ...presentation?.structureParams,
      preview: node.href,
    },
  })

  const handleCurrentToolClick = useCallback(() => {
    navigate?.({}, {preview: node.href})
  }, [node.href, navigate])

  return (
    <Card
      {...(isCurrentTool ? {} : presentationLinkProps)}
      as="a"
      key={node.href}
      onClick={isCurrentTool ? handleCurrentToolClick : presentationLinkProps.onClick}
      padding={3}
      radius={1}
      pressed={active}
      tone="inherit"
    >
      <Flex gap={3}>
        <Box flex="none">
          <Text size={1}>
            <DesktopIcon />
          </Text>
        </Box>
        <Stack flex={1} space={2}>
          <Text size={1} weight="medium">
            {node.title}
          </Text>
          <Text muted size={1} textOverflow="ellipsis">
            {node.href}
          </Text>
        </Stack>
      </Flex>
    </Card>
  )
}

/**
 * Compares two URLs to determine if they match based on origin, pathname, and search parameters
 * The previewUrl should have all the search parameters that are in the locationUrl
 */
function areUrlsMatching(previewUrlString: string, locationUrlString: string): boolean {
  try {
    const previewUrl = new URL(previewUrlString, location.origin)
    const locationUrl = new URL(locationUrlString, previewUrl.origin)

    // First compare origin and pathname
    if (previewUrl.origin !== locationUrl.origin || previewUrl.pathname !== locationUrl.pathname) {
      return false
    }

    // Then check search params
    // All search params in locationUrl must exist with the same values in previewUrl
    const locationParams = new URLSearchParams(locationUrl.search)
    const previewParams = new URLSearchParams(previewUrl.search)

    for (const [key, value] of locationParams.entries()) {
      if (previewParams.get(key) !== value) {
        return false
      }
    }

    return true
  } catch {
    // If URL parsing fails, URLs don't match
    return false
  }
}
