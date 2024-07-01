/* eslint-disable no-warning-comments */
/* eslint-disable i18next/no-literal-string */

import {CheckmarkIcon, ChevronDownIcon} from '@sanity/icons'
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
} from '@sanity/ui'
import {useCallback, useContext, useEffect, useState} from 'react'
import {DEFAULT_STUDIO_CLIENT_OPTIONS, useClient} from 'sanity'
import {useRouter} from 'sanity/router'

import {
  VersionContext,
  type VersionContextValue,
} from '../../../../_singletons/core/form/VersionContext'
import {type Version} from '../../types'
import {BUNDLES, LATEST} from '../../util/const'
import {getAllVersionsOfDocument, isDraftOrPublished} from '../../util/dummyGetters'
import {VersionBadge} from '../VersionBadge'

// TODO A LOT OF DOCUMENTED CODE IS RELATED TO SEARCH AND CREATING BUNDLE FROM HERE
// STILL NEED TO DECIDE IF WE KEEP IT OR NOT
export function DocumentVersionMenu(props: {
  documentId: string
  documentType: string
}): JSX.Element {
  const {documentId, documentType} = props
  //const {newVersion} = useDocumentOperation(documentId, documentType)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const router = useRouter()
  const {currentVersion, isDraft} = useContext<VersionContextValue>(VersionContext)
  const {name} = currentVersion
  // const toast = useToast()

  const [documentVersions, setDocumentVersions] = useState<Version[]>([])

  /*// search
  const [addVersionTitle, setAddVersionTitle] = useState('')
  const addVersionName = speakingurl(addVersionTitle)

  // use to prevent adding a version when you're already in that version
  const addVersionExists = BUNDLES.some((r) => r.name.toLocaleLowerCase() === addVersionName)

  // list of available bundles
  const bundleOptionsList = BUNDLES.filter((r) =>
    r.title.toLowerCase().includes(addVersionTitle.toLowerCase()),
  )*/

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
  /*const handleAddVersionChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setAddVersionTitle(event.target.value)
  }, [])

  const handleAddVersion = useCallback(
    (versionName: string) => () => {
      const nameSlugged = speakingurl(versionName)

      // only add to version if there isn't already a version in that bundle of this doc
      if (versionDocumentExists(documentVersions, versionName)) {
        toast.push({
          status: 'error',
          title: `There's already a version of this document in the bundle ${title}`,
        })
        return
      }
      const bundleId = `${nameSlugged}.${documentId}`

      newVersion.execute(bundleId)
    },
    [documentVersions, documentId, newVersion, toast, title],
  )*/

  const handleChangeToVersion = useCallback(
    (version: Version) => () => {
      const {name: versionName} = version

      if (isDraftOrPublished(versionName)) {
        router.navigateStickyParam('perspective', '')
      } else {
        router.navigateStickyParam('perspective', `bundle.${versionName}`)
      }
    },
    [router],
  )

  const onMenuOpen = useCallback(async () => {
    //setAddVersionTitle('')
    fetchVersions()
  }, [fetchVersions])

  /* TODO Version Badge should only show when the current opened document is in a version */

  return (
    <>
      {currentVersion && !isDraft && (
        <VersionBadge
          tone={currentVersion.tone}
          title={currentVersion.title}
          icon={currentVersion.icon}
          padding={2}
        />
      )}

      {/** TODO IS THIS STILL NEEDED? VS THE PICKER IN STUDIO NAVBAR? */}

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
                  onClick={handleChangeToVersion(LATEST)}
                  pressed={isDraft}
                  text={LATEST.title}
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

                    {documentVersions
                      .filter((b) => !isDraftOrPublished(b.name))
                      .map((b) => (
                        <MenuItem
                          key={b.name}
                          href=""
                          onClick={handleChangeToVersion(b)}
                          padding={1}
                          pressed={name === b.name}
                        >
                          <Flex>
                            {<VersionBadge tone={b.tone} icon={b.icon} padding={2} />}

                            <Box flex={1} padding={2} style={{minWidth: 100}}>
                              <Text size={1} weight="medium">
                                {b.title}
                              </Text>
                            </Box>

                            {
                              <Box padding={2}>
                                <Text muted size={1}>
                                  {/* localize text */}
                                  {b.publishAt
                                    ? `a date will be here ${b.publishAt}`
                                    : 'No target date'}
                                </Text>
                              </Box>
                            }

                            <Box padding={2}>
                              <Text size={1}>
                                {<CheckmarkIcon style={{opacity: b.name === name ? 1 : 0}} />}
                              </Text>
                            </Box>
                          </Flex>
                        </MenuItem>
                      ))}
                  </Stack>

                  <MenuDivider />
                </>
              )}

              {/*<Stack padding={1} space={1}>
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
                          <VersionBadge tone={r.tone} icon={r.icon} padding={2} />

                          <Box flex={1} padding={2} style={{minWidth: 100}}>
                            <Text size={1} weight="medium">
                              {r.name === 'draft' ? LATEST.title : r.title}
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

                    // localize text
                    <MenuItem
                      disabled={addVersionExists}
                      icon={AddIcon}
                      onClick={handleAddVersion(addVersionName)}
                      text={<>Create version: "{addVersionTitle}"</>}
                    />
                  </></Menu>
                )}
              </Stack>*/}
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
