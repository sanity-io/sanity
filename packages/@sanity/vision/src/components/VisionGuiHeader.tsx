import {type ChangeEvent, useCallback, useRef} from 'react'
import {CopyIcon} from '@sanity/icons'
import {
  TextInput,
  Grid,
  Box,
  Stack,
  Card,
  Select,
  Inline,
  Flex,
  Tooltip,
  Button,
  Text,
  useToast,
} from '@sanity/ui'
import {useTranslation} from 'sanity'
import {API_VERSIONS} from '../apiVersions'
import {PERSPECTIVES} from '../perspectives'
import {visionLocaleNamespace} from '../i18n'
import {validateApiVersion} from '../util/validateApiVersion'
import {useVisionApiVersion, useVisionDataset, useVisionPerspective} from '../hooks'
import {PerspectivePopover} from './PerspectivePopover'
import {Header, StyledLabel, QueryCopyLink} from './VisionGui.styled'
import {useVisionStore} from './VisionStoreContext'

interface VisionGuiHeadProps {
  handleQueryExecution: () => void
}

export function VisionGuiHeader(props: VisionGuiHeadProps) {
  const {handleQueryExecution} = props
  const toast = useToast()
  const {t} = useTranslation(visionLocaleNamespace)

  const {queryUrl, datasets} = useVisionStore()
  const [dataset, setDataset] = useVisionDataset()
  const {apiVersion, setApiVersion, customApiVersion, setCustomApiVersion, isValidApiVersion} =
    useVisionApiVersion()
  const [perspective, setPerspective] = useVisionPerspective()

  const operationUrlElement = useRef<HTMLInputElement>(null)
  const _customApiVersionElement = useRef<HTMLInputElement>(null)

  const handleChangeDataset = useCallback(
    (evt: ChangeEvent<HTMLSelectElement>) => {
      setDataset(evt.target.value, handleQueryExecution)
    },
    [setDataset, handleQueryExecution],
  )

  const handleChangeApiVersion = useCallback(
    (evt: ChangeEvent<HTMLSelectElement>) => {
      const {value = ''} = evt.target

      if (value.toLowerCase() === 'other') {
        setCustomApiVersion('v')
        _customApiVersionElement.current?.focus()
        return
      }

      setApiVersion(value, handleQueryExecution)
    },
    [setApiVersion, handleQueryExecution, setCustomApiVersion],
  )

  const handleChangePerspective = useCallback(
    (evt: ChangeEvent<HTMLSelectElement>) => {
      setPerspective(evt.target.value, handleQueryExecution)
    },
    [setPerspective, handleQueryExecution],
  )

  const handleCustomApiVersionChange = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => {
      const {value = ''} = evt.target
      if (validateApiVersion(value)) {
        setApiVersion(value)
      }

      setCustomApiVersion(value || 'v')
    },
    [setCustomApiVersion, setApiVersion],
  )

  const handleCopyUrl = useCallback(() => {
    const el = operationUrlElement.current
    if (!el) {
      return
    }

    try {
      el.select()
      document.execCommand('copy')
      toast.push({
        closable: true,
        title: 'Copied to clipboard',
        status: 'info',
        id: 'vision-copy',
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Unable to copy to clipboard :(')
    }
  }, [toast])

  return (
    <Header paddingX={3} paddingY={2}>
      <Grid columns={[1, 4, 8, 12]}>
        {/* Dataset selector */}
        <Box padding={1} column={2}>
          <Stack>
            <Card paddingTop={2} paddingBottom={3}>
              <StyledLabel>{t('settings.dataset-label')}</StyledLabel>
            </Card>
            <Select value={dataset} onChange={handleChangeDataset}>
              {datasets.map((ds) => (
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
              value={
                customApiVersion === false ? apiVersion : t('settings.other-api-version-label')
              }
              onChange={handleChangeApiVersion}
            >
              {API_VERSIONS.map((version) => (
                <option key={version}>{version}</option>
              ))}
              <option key="other" value={t('settings.other-api-version-label')}>
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
                ref={_customApiVersionElement}
                value={customApiVersion}
                onChange={handleCustomApiVersionChange}
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

            <Select value={perspective} onChange={handleChangePerspective}>
              {PERSPECTIVES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </Stack>
        </Box>

        {/* Query URL (for copying) */}
        {typeof queryUrl === 'string' ? (
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
                  <TextInput readOnly type="url" ref={operationUrlElement} value={queryUrl} />
                </Box>
                <Tooltip
                  content={
                    <Box padding={2}>
                      <Text>{t('action.copy-url-to-clipboard')}</Text>
                    </Box>
                  }
                >
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
