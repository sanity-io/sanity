/* eslint-disable i18next/no-literal-string */
import {AddIcon, ChevronDownIcon} from '@sanity/icons'
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
import {useCallback, useState} from 'react'
import {useDocumentOperation} from 'sanity'

function toSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

// dummy data
const BUNDLE_OPTIONS = [
  {name: '', title: 'Create new bundle'},
  {name: 'draft', title: 'Published + Drafts'},
  {name: 'previewDrafts', title: 'Preview drafts'},
  {name: 'published', title: 'Published'},
  {name: 'summerDrop', title: 'Summer Drop'},
  {name: 'autumnDrop', title: 'Autumn Drop'},
]

// dummy data
const DOC_EXISTING_VERSIONS: any[] = []

export function DocumentVersionMenu(props: {
  documentId: string
  documentType: string
}): JSX.Element {
  const {documentId, documentType} = props
  const {newVersion} = useDocumentOperation(documentId, documentType)

  const [addVersionTitle, setAddVersionTitle] = useState('')

  const addVersionName = toSlug(addVersionTitle)
  // use to prevent adding a version when you're already in that version
  const addVersionExists = BUNDLE_OPTIONS.some((r) => r.name === addVersionName)

  // list of available bundles
  const bundleOptionsList = BUNDLE_OPTIONS.filter((r) =>
    r.title.toLowerCase().includes(addVersionTitle.toLowerCase()),
  )

  /* used for the search of bundles when writing a new version name */
  const handleAddVersionChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setAddVersionTitle(event.target.value)
  }, [])

  const handleAddVersion = useCallback(
    (name: string) => () => {
      const bundleId = `${name}.${documentId}`

      newVersion.execute(bundleId)
    },
    [documentId, newVersion],
  )

  const handleAddNewVersion = useCallback(
    (name: string) => () => {
      if (!name) return

      //BUNDLE_OPTIONS.push({name: addVersionName, title: name})

      handleAddVersion(addVersionName)
    },
    [addVersionName, handleAddVersion],
  )

  const handleChangeToVersion = useCallback(
    (name: string) => () => {
      // eslint-disable-next-line no-console
      console.log('changing to an already existing version', name)
    },
    [],
  )

  return (
    <>
      <Box flex="none">
        <MenuButton
          button={<Button icon={ChevronDownIcon} mode="bleed" padding={2} space={2} />}
          id="version-menu"
          menu={
            <Menu padding={0} space={0}>
              {/*<Stack padding={1}>
                <MenuItem
                  iconRight={
                    draftVersionName === 'draft' ? (
                      CheckmarkIcon
                    ) : (
                      <CheckmarkIcon style={{opacity: 0}} />
                    )
                  }
                  onClick={() => {
                    setVersionName('draft')
                    setDraftVersionName('draft')
                  }}
                  // padding={2}
                  pressed={draftVersionName === 'draft'}
                  text="Latest version"
                />
              </Stack>*/}

              <MenuDivider />

              {BUNDLE_OPTIONS.length > 0 && (
                <>
                  <Stack padding={1} space={1}>
                    <Box padding={3} paddingBottom={2}>
                      {/*                      
                      localize text
                      */}
                      <Label muted size={1}>
                        {/* localise text */}
                        Versions
                      </Label>
                    </Box>

                    {DOC_EXISTING_VERSIONS.map((r) => (
                      <MenuItem
                        key={r.name}
                        onClick={handleChangeToVersion(r.name)}
                        padding={1}
                        //pressed={draftVersionName === r.name}
                      >
                        <Flex>
                          {/*<ReleaseIcon hue={r.hue} icon={r.icon} padding={2} />*/}

                          <Box flex={1} padding={2} style={{minWidth: 100}}>
                            <Text size={1} weight="medium">
                              {r.name === 'draft' ? 'Latest' : r.title}
                            </Text>
                          </Box>

                          {/*<Box padding={2}>
                            <Text muted size={1}>
                              {r.publishAt ? formatRelativeTime(r.publishAt) : 'No target date'}
                            </Text>
                          </Box>*/}

                          <Box padding={2}>
                            <Text size={1}>
                              {/*<CheckmarkIcon
                                style={{opacity: r.name === draftVersionName ? 1 : 0}}
                              />*/}
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
                          {/*<ReleaseIcon hue={r.hue} icon={r.icon} padding={2} />*/}

                          <Box flex={1} padding={2} style={{minWidth: 100}}>
                            <Text size={1} weight="medium">
                              {r.name === 'draft' ? 'Latest' : r.title}
                            </Text>
                          </Box>

                          <Box padding={2}>
                            {/*<Text muted size={1}>
                              {r.publishAt ? formatRelativeTime(r.publishAt) : 'No target date'}
                            </Text>*/}
                          </Box>

                          {/* 
                            <Text size={1}>
                              <CheckmarkIcon
                                style={{opacity: r.name === (query.version || 'draft') ? 1 : 0}}
                              />
                            </Text>
                          </div> */}
                        </Flex>
                      </MenuItem>
                    ))}

                    <MenuItem
                      disabled={addVersionExists}
                      icon={AddIcon}
                      onClick={handleAddNewVersion(addVersionName)}
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
