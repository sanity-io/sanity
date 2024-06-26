/* eslint-disable i18next/no-literal-string */
import {AddIcon, CheckmarkIcon, ChevronDownIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Flex,
  Label,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  Stack,
  Text,
  TextInput,
} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {DEFAULT_STUDIO_CLIENT_OPTIONS, useClient, useDocumentOperation} from 'sanity'

import {
  BUNDLES,
  getAllVersionsOfDocument,
  getVersionName,
  type Version,
} from '../../../../core/util/versions/util'
import {ReleaseIcon} from './ReleaseIcon'

function toSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export function DocumentVersionMenu(props: {
  documentId: string
  documentType: string
}): JSX.Element {
  const {documentId, documentType} = props
  const {newVersion} = useDocumentOperation(documentId, documentType)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const selectedVersion = getVersionName(documentId)
  const isDraft = selectedVersion === 'draft'

  const [documentVersions, setDocumentVersions] = useState<Version[]>([])

  // search
  const [addVersionTitle, setAddVersionTitle] = useState('')
  const addVersionName = toSlug(addVersionTitle)

  // use to prevent adding a version when you're already in that version
  const addVersionExists = BUNDLES.some((r) => r.name.toLocaleLowerCase() === addVersionName)

  // list of available bundles
  const bundleOptionsList = BUNDLES.filter((r) =>
    r.title.toLowerCase().includes(addVersionTitle.toLowerCase()),
  )

  const fetchVersions = useCallback(async () => {
    const response = await getAllVersionsOfDocument(client, documentId)
    setDocumentVersions(response)
  }, [client, documentId])

  // DUMMY FETCH -- NEEDS TO BE REPLACED -- USING GROQ from utils
  useEffect(() => {
    const fetchVersionsInner = async () => {
      fetchVersions()
    }

    fetchVersionsInner()
  }, [fetchVersions])

  /* used for the search of bundles when writing a new version name */
  const handleAddVersionChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setAddVersionTitle(event.target.value)
  }, [])

  const handleAddVersion = useCallback(
    (name: string) => () => {
      const nameSlugged = toSlug(name)
      const bundleId = `${nameSlugged}.${documentId}`

      newVersion.execute(bundleId)
    },
    [documentId, newVersion],
  )

  const handleChangeToVersion = useCallback(
    (name: string) => () => {
      // eslint-disable-next-line no-console
      console.log('changing to an already existing version', name)
    },
    [],
  )

  const handleGoToLatest = useCallback(
    () => () => {
      // eslint-disable-next-line no-console
      console.log('switching into drafts / latest')
    },
    [],
  )

  const onMenuOpen = useCallback(async () => {
    setAddVersionTitle('')
    fetchVersions()
  }, [fetchVersions])

  return (
    <>
      <Box flex="none">
        <MenuButton
          button={<Button icon={ChevronDownIcon} mode="bleed" padding={2} space={2} />}
          id="version-menu"
          onOpen={onMenuOpen}
          menu={
            <Menu padding={0} space={0}>
              <Stack padding={1}>
                {/* localize text */}
                <MenuItem
                  iconRight={isDraft ? CheckmarkIcon : <CheckmarkIcon style={{opacity: 0}} />}
                  onClick={handleGoToLatest()}
                  pressed={isDraft}
                  // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
                  text="Latest version"
                />
              </Stack>

              <MenuDivider />

              {BUNDLES.length > 0 && (
                <>
                  <Stack padding={1} space={1}>
                    <Box padding={3} paddingBottom={2}>
                      {/*                      
                      localize text
                      */}
                      <Label muted size={1}>
                        {/* localize text */}
                        Versions
                      </Label>
                    </Box>

                    {documentVersions.map((r) => (
                      <MenuItem
                        key={r.name}
                        onClick={handleChangeToVersion(r.name)}
                        padding={1}
                        pressed={selectedVersion === r.name}
                      >
                        <Flex>
                          {<ReleaseIcon hue={r.hue} icon={r.icon} padding={2} />}

                          <Box flex={1} padding={2} style={{minWidth: 100}}>
                            <Text size={1} weight="medium">
                              {/* localize text */}
                              {r.name === 'draft' ? 'Latest' : r.title}
                            </Text>
                          </Box>

                          {
                            <Box padding={2}>
                              <Text muted size={1}>
                                {/* localize text */}
                                {r.publishAt
                                  ? `a date will be here ${r.publishAt}`
                                  : 'No target date'}
                              </Text>
                            </Box>
                          }

                          <Box padding={2}>
                            <Text size={1}>
                              {
                                <CheckmarkIcon
                                  style={{opacity: r.name === selectedVersion ? 1 : 0}}
                                />
                              }
                            </Text>
                          </Box>
                        </Flex>
                      </MenuItem>
                    ))}
                  </Stack>

                  <MenuDivider />
                </>
              )}

              <Stack padding={1} space={1}>
                <Box>
                  <TextInput
                    border={false}
                    fontSize={1}
                    onChange={handleAddVersionChange}
                    placeholder="Create version"
                    value={addVersionTitle}
                  />
                </Box>

                {addVersionTitle && (
                  <>
                    {bundleOptionsList.map((r) => (
                      <MenuItem
                        disabled={r.name === addVersionName}
                        key={r.name}
                        onClick={handleAddVersion(r.name)}
                        padding={1}
                      >
                        <Flex>
                          <ReleaseIcon hue={r.hue} icon={r.icon} padding={2} />

                          <Box flex={1} padding={2} style={{minWidth: 100}}>
                            <Text size={1} weight="medium">
                              {r.name === 'draft' ? 'Latest' : r.title}
                            </Text>
                          </Box>

                          <Box padding={2}>
                            <Text muted size={1}>
                              {r.publishAt
                                ? `a date will be here ${r.publishAt}`
                                : 'No target date'}
                            </Text>
                          </Box>
                        </Flex>
                      </MenuItem>
                    ))}

                    {/* localize text */}
                    <MenuItem
                      disabled={addVersionExists}
                      icon={AddIcon}
                      onClick={handleAddVersion(addVersionName)}
                      text={<>Create version: "{addVersionTitle}"</>}
                    />
                  </>
                )}
              </Stack>
            </Menu>
          }
          popover={{
            constrainSize: true,
            fallbackPlacements: [],
            placement: 'bottom-start',
            portal: true,
            tone: 'default',
          }}
        />
      </Box>
    </>
  )
}
