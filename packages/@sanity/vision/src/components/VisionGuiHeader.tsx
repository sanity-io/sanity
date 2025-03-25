import {CopyIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Grid, Inline, Select, Stack, TextInput, Tooltip} from '@sanity/ui'
import {
  type ChangeEvent,
  type ComponentType,
  Fragment,
  type RefObject,
  useCallback,
  useMemo,
  useRef,
} from 'react'
import {type PerspectiveContextValue, type TFunction, usePerspective, useTranslation} from 'sanity'

import {API_VERSIONS} from '../apiVersions'
import {visionLocaleNamespace} from '../i18n'
import {
  hasPinnedPerspective,
  SUPPORTED_PERSPECTIVES,
  type SupportedPerspective,
} from '../perspectives'
import {PerspectivePopover} from './PerspectivePopover'
import {Header, QueryCopyLink, StyledLabel} from './VisionGui.styled'

const PinnedReleasePerspectiveOption: ComponentType<{
  pinnedPerspective: PerspectiveContextValue
  t: TFunction
}> = ({pinnedPerspective, t}) => {
  const name =
    typeof pinnedPerspective.selectedPerspective === 'object'
      ? pinnedPerspective.selectedPerspective.metadata.title
      : pinnedPerspective.selectedPerspectiveName

  const label = hasPinnedPerspective(pinnedPerspective)
    ? `(${t('settings.perspectives.pinned-release-label')})`
    : t('settings.perspectives.pinned-release-label')

  const text = useMemo(
    () => [name, label].filter((value) => typeof value !== 'undefined').join(' '),
    [label, name],
  )

  return (
    <option value="pinnedRelease" disabled={!hasPinnedPerspective(pinnedPerspective)}>
      {text}
    </option>
  )
}

export interface VisionGuiHeaderProps {
  onChangeDataset: (evt: ChangeEvent<HTMLSelectElement>) => void
  dataset: string
  customApiVersion: string | false
  apiVersion: string
  onChangeApiVersion: (evt: ChangeEvent<HTMLSelectElement>) => void
  datasets: string[]
  customApiVersionElementRef: RefObject<HTMLInputElement | null>
  onCustomApiVersionChange: (evt: ChangeEvent<HTMLInputElement>) => void
  isValidApiVersion: boolean
  onChangePerspective: (evt: ChangeEvent<HTMLSelectElement>) => void
  url?: string
  perspective?: SupportedPerspective
}

export function VisionGuiHeader({
  onChangeDataset,
  dataset,
  customApiVersion,
  apiVersion,
  onChangeApiVersion,
  datasets,
  customApiVersionElementRef,
  onCustomApiVersionChange,
  isValidApiVersion,
  onChangePerspective,
  url,
  perspective,
}: VisionGuiHeaderProps) {
  const pinnedPerspective = usePerspective()
  const {t} = useTranslation(visionLocaleNamespace)
  const operationUrlElement = useRef<HTMLInputElement | null>(null)
  const handleCopyUrl = useCallback(() => {
    const el = operationUrlElement.current
    if (!el) return

    try {
      el.select()
      document.execCommand('copy')
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Unable to copy to clipboard :(')
    }
  }, [])

  return (
    <Header paddingX={3} paddingY={2}>
      <Grid columns={[1, 4, 8, 12]}>
        {/* Dataset selector */}
        <Box padding={1} column={2}>
          <Stack>
            <Card paddingTop={2} paddingBottom={3}>
              <StyledLabel>{t('settings.dataset-label')}</StyledLabel>
            </Card>
            <Select value={dataset} onChange={onChangeDataset}>
              {datasets.map((ds: string) => (
                <option key={ds}>{ds}</option>
              ))}
            </Select>
          </Stack>
        </Box>

        {/* API version selector */}
        <Box padding={1} column={2}>
          <Stack>
            <Card paddingTop={2} paddingBottom={3}>
              <StyledLabel>{t('settings.api-version-label')}</StyledLabel>
            </Card>
            <Select
              data-testid="api-version-selector"
              value={customApiVersion === false ? apiVersion : 'other'}
              onChange={onChangeApiVersion}
            >
              {API_VERSIONS.map((version) => (
                <option key={version}>{version}</option>
              ))}
              <option key="other" value="other">
                {t('settings.other-api-version-label')}
              </option>
            </Select>
          </Stack>
        </Box>

        {/* Custom API version input */}
        {customApiVersion !== false && (
          <Box padding={1} column={2}>
            <Stack>
              <Card paddingTop={2} paddingBottom={3}>
                <StyledLabel textOverflow="ellipsis">
                  {t('settings.custom-api-version-label')}
                </StyledLabel>
              </Card>

              <TextInput
                ref={customApiVersionElementRef}
                value={customApiVersion}
                onChange={onCustomApiVersionChange}
                customValidity={
                  isValidApiVersion ? undefined : t('settings.error.invalid-api-version')
                }
                maxLength={11}
              />
            </Stack>
          </Box>
        )}

        {/* Perspective selector */}
        <Box padding={1} column={2}>
          <Stack>
            <Card paddingBottom={1}>
              <Inline space={1}>
                <Box>
                  <StyledLabel>{t('settings.perspective-label')}</StyledLabel>
                </Box>

                <Box>
                  <PerspectivePopover />
                </Box>
              </Inline>
            </Card>
            <Select value={perspective || 'default'} onChange={onChangePerspective}>
              {SUPPORTED_PERSPECTIVES.map((perspectiveName) => {
                if (perspectiveName === 'pinnedRelease') {
                  return (
                    <Fragment key="pinnedRelease">
                      <PinnedReleasePerspectiveOption pinnedPerspective={pinnedPerspective} t={t} />
                      <option key="default" value="default">
                        {t('settings.perspectives.default')}
                      </option>
                      <hr />
                    </Fragment>
                  )
                }
                return <option key={perspectiveName}>{perspectiveName}</option>
              })}
            </Select>
          </Stack>
        </Box>

        {/* Query URL (for copying) */}
        {typeof url === 'string' ? (
          <Box padding={1} flex={1} column={customApiVersion === false ? 6 : 4}>
            <Stack>
              <Card paddingTop={2} paddingBottom={3}>
                <StyledLabel>
                  {t('query.url')}&nbsp;
                  <QueryCopyLink onClick={handleCopyUrl}>
                    [{t('action.copy-url-to-clipboard')}]
                  </QueryCopyLink>
                </StyledLabel>
              </Card>
              <Flex flex={1} gap={1}>
                <Box flex={1}>
                  <TextInput readOnly type="url" ref={operationUrlElement} value={url} />
                </Box>
                <Tooltip content={t('action.copy-url-to-clipboard')}>
                  <Button
                    aria-label={t('action.copy-url-to-clipboard')}
                    type="button"
                    mode="ghost"
                    icon={CopyIcon}
                    onClick={handleCopyUrl}
                  />
                </Tooltip>
              </Flex>
            </Stack>
          </Box>
        ) : (
          <Box flex={1} />
        )}
      </Grid>
    </Header>
  )
}
