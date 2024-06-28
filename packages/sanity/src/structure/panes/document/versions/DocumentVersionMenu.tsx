/* eslint-disable no-warning-comments */
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
  useToast,
} from '@sanity/ui'
import {camelCase} from 'lodash'
import {useCallback, useContext, useEffect, useState} from 'react'
import {DEFAULT_STUDIO_CLIENT_OPTIONS, useClient, useDocumentOperation} from 'sanity'
import {useRouter} from 'sanity/router'

import {VersionContext} from '../../../../_singletons/core/form/VersionContext'
import {ReleaseIcon} from '../../../../core/versions/components/ReleaseIcon'
import {VersionBadge} from '../../../../core/versions/components/VersionBadge'
import {type Version} from '../../../../core/versions/types'
import {BUNDLES} from '../../../../core/versions/util/const'
import {
  getAllVersionsOfDocument,
  versionDocumentExists,
} from '../../../../core/versions/util/dummyGetters'

function toSlug(str: string) {
  return camelCase(str)
}

export function DocumentVersionMenu(props: {
  documentId: string
  documentType: string
}): JSX.Element {
  const {documentId, documentType} = props
  const {newVersion} = useDocumentOperation(documentId, documentType)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const router = useRouter()
  const toast = useToast()
  const {currentVersion, isDraft} = useContext(VersionContext)

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

      // only add to version if there isn't already a version in that bundle of this doc
      if (versionDocumentExists(documentVersions, name)) {
        toast.push({
          status: 'error',
          title: `There's already a version of this document in the bundle ${currentVersion.title}`,
        })
        return
      }

      const bundleId = `${nameSlugged}.${documentId}`

      newVersion.execute(bundleId)
    },
    [documentId, newVersion, toast],
  )

  const handleChangeToVersion = useCallback(
    (name: string) => () => {
      if (name === 'drafts') {
        router.navigateStickyParam('perspective', '')
      } else {
        router.navigateStickyParam('perspective', `bundle.${name}`)
      }
    },
    [router],
  )

  const handleGoToLatest = useCallback(
    () => () => {
      router.navigateStickyParam('perspective', '')
    },
    [router],
  )

  const onMenuOpen = useCallback(async () => {
    setAddVersionTitle('')
    fetchVersions()
  }, [fetchVersions])

  /* TODO Version Badge should only show when the current opened document is in a version */

  return (
    <>
      {currentVersion && !isDraft && <VersionBadge version={currentVersion} />}

      {/** TODO IS THIS STILL NEEDED? VS THE PICKER IN STUDIO NAVBAR? */}

      <Box flex="none" hidden>
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
                        href=""
                        onClick={handleChangeToVersion(r.name)}
                        padding={1}
                        pressed={currentVersion.name === r.name}
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
                                  style={{opacity: r.name === currentVersion.name ? 1 : 0}}
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
