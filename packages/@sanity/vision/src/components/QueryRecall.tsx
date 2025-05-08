import {AddIcon, EllipsisVerticalIcon, SearchIcon, TrashIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Code,
  Flex,
  Menu,
  MenuButton,
  Stack,
  Text,
  TextInput,
  useToast,
} from '@sanity/ui'
import isEqual from 'lodash/isequal'
import {type ReactElement, useCallback, useState} from 'react'
import {useTranslation} from 'sanity'

import {type QueryConfig, useSavedQueries} from '../hooks/useSavedQueries'
import {visionLocaleNamespace} from '../i18n'
import {FixedHeader, ScrollContainer} from './QueryRecall.styled'
import {type ParsedUrlState} from './VisionGui'

// TODO: Locale from user preferences?
const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(new Date(date))
    .replace(',', '')
}

// Utility to normalize URLs for comparison
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url, window.location.origin)
    // Sort query params for consistent comparison
    u.search = new URLSearchParams(Array.from(u.searchParams.entries()).sort()).toString()
    // Remove trailing slash for consistency
    u.pathname = u.pathname.replace(/\/$/, '')
    return u.toString()
  } catch (e) {
    // If URL constructor fails, fallback to original
    return url
  }
}

// TODO
// -saving behavior - be explicit that things have changed & need to be saved
// -check typing for url parser and state setter
// -show when the selected query has been edited but not saved

// -save state
// -get design approval in studio channel
export function QueryRecall({
  url,
  getStateFromUrl,
  setStateFromParsedUrl,
}: {
  url?: string
  getStateFromUrl: (data: string) => ParsedUrlState | null
  setStateFromParsedUrl: (parsedUrlObj: ParsedUrlState) => void
}): ReactElement {
  const toast = useToast()
  const {saveQuery, updateQuery, queries, deleteQuery, saving, deleting, saveQueryError} =
    useSavedQueries()
  const {t} = useTranslation(visionLocaleNamespace)

  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [optimisticTitles, setOptimisticTitles] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUrl, setSelectedUrl] = useState<string | undefined>(url)
  // const [optimisticShared, setOptimisticShared] = useState<Record<string, boolean>>({})

  const handleSave = useCallback(async () => {
    const normalizedUrl = url ? normalizeUrl(url) : undefined
    const normalizedQueryUrls = queries?.map((q) => normalizeUrl(q.url)) || []
    if (normalizedUrl && normalizedQueryUrls.includes(normalizedUrl)) {
      toast.push({
        closable: true,
        status: 'warning',
        title: t('save-query.already-saved'),
        description: `${queries.find((q) => normalizeUrl(q.url) === normalizedUrl)?.title} - ${formatDate(
          queries.find((q) => normalizeUrl(q.url) === normalizedUrl)?.savedAt || '',
        )}`,
      })
      return
    }
    if (url) {
      // @ts-expect-error why doesn't Omit work?
      await saveQuery({
        url,
        savedAt: new Date().toISOString(),
        title: 'Untitled',
      })
    }
    if (saveQueryError) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('save-query.error'),
        description: saveQueryError.message,
      })
    } else {
      toast.push({
        closable: true,
        status: 'success',
        title: t('save-query.success'),
      })
    }
  }, [queries, url, saveQuery, saveQueryError, toast, t])

  const handleTitleSave = useCallback(
    async (query: QueryConfig, newTitle: string) => {
      setEditingKey(null)
      setOptimisticTitles((prev) => ({...prev, [query._key]: newTitle}))

      try {
        await updateQuery({
          ...query,
          title: newTitle,
        })
        // Clear optimistic title on success
        setOptimisticTitles((prev) => {
          const next = {...prev}
          delete next[query._key]
          return next
        })
      } catch (err) {
        // Clear optimistic title on error
        setOptimisticTitles((prev) => {
          const next = {...prev}
          delete next[query._key]
          return next
        })
        toast.push({
          closable: true,
          status: 'error',
          title: t('save-query.error'),
          description: err.message,
        })
      }
    },
    [updateQuery, toast, t],
  )

  const filteredQueries = queries?.filter((q) => {
    return q?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // useEffect(() => {
  //   if (url !== selectedUrl) {
  //     setSelectedUrl(url)
  //   }
  // }, [url])
  // console.log('url', url)
  // useEffect(() => {}, [url])
  return (
    <ScrollContainer>
      <FixedHeader space={3}>
        <Flex padding={3} paddingTop={4} paddingBottom={0} justify="space-between" align="center">
          <Text weight="semibold" style={{textTransform: 'capitalize'}} size={4}>
            {t('label.saved-queries')}
          </Text>
          <Button
            label={t('action.save-query')}
            icon={AddIcon}
            disabled={saving}
            onClick={handleSave}
            mode="bleed"
          />
        </Flex>
        <Box padding={3} paddingTop={0}>
          <TextInput
            placeholder={t('label.search-queries')}
            icon={SearchIcon}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
          />
        </Box>
      </FixedHeader>
      <Stack paddingY={3}>
        {filteredQueries?.map((q) => {
          // console.log('q', q.url === url)
          const queryObj = getStateFromUrl(q.url)
          const queryStateObj = getStateFromUrl(url)
          const isSelected = selectedUrl === q.url
          const isEdited = isSelected && !isEqual(queryStateObj, queryObj)
          return (
            <Card
              key={q._key}
              width={'fill'}
              padding={4}
              border
              tone={isSelected ? 'positive' : 'default'}
              onClick={() => {
                setSelectedUrl(q.url) // Update the selected query immediately
                const parsedUrl = getStateFromUrl(q.url)
                if (parsedUrl) {
                  setStateFromParsedUrl(parsedUrl)
                }
              }}
            >
              <Stack space={3}>
                <Flex justify="space-between" align={'center'}>
                  <Flex align="center" gap={2} paddingRight={1}>
                    {editingKey === q._key ? (
                      <TextInput
                        value={editingTitle}
                        onChange={(event) => setEditingTitle(event.currentTarget.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            handleTitleSave(q, editingTitle)
                          } else if (event.key === 'Escape') {
                            setEditingKey(null)
                          }
                        }}
                        onBlur={() => handleTitleSave(q, editingTitle)}
                        autoFocus
                        style={{maxWidth: '170px', height: '24px'}}
                      />
                    ) : (
                      <Text
                        weight="bold"
                        size={3}
                        textOverflow="ellipsis"
                        style={{maxWidth: '170px', cursor: 'pointer', padding: '4px 0'}}
                        title={
                          optimisticTitles[q._key] ||
                          q.title ||
                          q._key.slice(q._key.length - 5, q._key.length)
                        }
                        onClick={() => {
                          setEditingKey(q._key)
                          setEditingTitle(q.title || q._key.slice(0, 5))
                        }}
                      >
                        {optimisticTitles[q._key] ||
                          q.title ||
                          q._key.slice(q._key.length - 5, q._key.length)}
                      </Text>
                    )}
                    {isEdited && (
                      <Text size={1} muted>
                        {t('label.edited')}
                      </Text>
                    )}
                  </Flex>
                  <Flex gap={2} align="center">
                    {/* <Badge
                      tone={(optimisticShared[q._key] ?? q.shared) ? 'positive' : 'primary'}
                      size={1}
                      padding={2}
                      radius={1}
                    >
                      {t((optimisticShared[q._key] ?? q.shared) ? 'label.team' : 'label.personal')}
                    </Badge> */}
                    <MenuButton
                      button={<EllipsisVerticalIcon />}
                      id={`${q._key}-menu`}
                      menu={
                        <Menu>
                          {/* <Button
                            mode="bleed"
                            width="fill"
                            onClick={(event) => {
                              event.stopPropagation()
                              setEditingKey(q._key)
                              setEditingTitle(q.title || q._key.slice(0, 5))
                            }}
                          >
                            <Flex align="center" gap={2} padding={1}>
                              <Box
                                style={{fontSize: '1.25em', display: 'flex', alignItems: 'center'}}
                              >
                                <EditIcon />
                              </Box>
                              <Text size={1}>{t('action.edit-title')}</Text>
                            </Flex>
                          </Button> */}
                          <Button
                            mode="bleed"
                            tone="critical"
                            width="fill"
                            onClick={(event) => {
                              event.stopPropagation()
                              deleteQuery(q._key)
                            }}
                            disabled={deleting.includes(q._key)}
                          >
                            <Flex align="center" gap={2} padding={1}>
                              <Box
                                style={{fontSize: '1.25em', display: 'flex', alignItems: 'center'}}
                              >
                                <TrashIcon />
                              </Box>
                              <Text size={1}>{t('action.delete')}</Text>
                            </Flex>
                          </Button>
                          {/* <MenuDivider />
                          <Button
                            mode="bleed"
                            width="fill"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleShareToggle(q)
                            }}
                          >
                            <Flex align="center" gap={2} padding={1}>
                              <Box
                                style={{fontSize: '1.25em', display: 'flex', alignItems: 'center'}}
                              >
                                <Switch
                                  onChange={(event) => {
                                    event.stopPropagation()
                                    handleShareToggle(q)
                                  }}
                                  checked={optimisticShared[q._key] ?? q.shared}
                                />
                              </Box>
                              <Text size={1}>{t('label.share')}</Text>
                            </Flex>
                          </Button> */}
                        </Menu>
                      }
                      popover={{portal: true, placement: 'bottom-end'}}
                    />
                  </Flex>
                </Flex>

                <Code muted>{queryObj?.query.split('{')[0]}</Code>

                <Flex align="center" gap={1}>
                  {/* <ClockIcon /> */}
                  <Text size={1} muted>
                    {formatDate(q.savedAt)}
                  </Text>
                </Flex>
              </Stack>
            </Card>
          )
        })}
      </Stack>
    </ScrollContainer>
  )
}
