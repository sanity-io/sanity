import {AddIcon, EllipsisVerticalIcon, SearchIcon, TrashIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Code,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  Stack,
  Text,
  TextInput,
  useToast,
} from '@sanity/ui'
import {isEqual} from 'lodash'
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

export function QueryRecall({
  url,
  getStateFromUrl,
  setStateFromParsedUrl,
  currentQuery,
  currentParams,
  generateUrl,
}: {
  url?: string
  getStateFromUrl: (data: string) => ParsedUrlState | null
  setStateFromParsedUrl: (parsedUrlObj: ParsedUrlState) => void
  currentQuery: string
  currentParams: Record<string, unknown>
  generateUrl: (query: string, params: Record<string, unknown>) => string
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
    // Generate the correct URL first
    const newUrl = generateUrl(currentQuery, currentParams)

    // Check for duplicates by comparing query content and params
    const isDuplicate = queries?.some((q) => {
      const savedQueryObj = getStateFromUrl(q.url)
      return (
        savedQueryObj &&
        savedQueryObj.query === currentQuery &&
        isEqual(savedQueryObj.params, currentParams)
      )
    })

    if (isDuplicate) {
      const duplicateQuery = queries?.find((q) => {
        const savedQueryObj = getStateFromUrl(q.url)
        return (
          savedQueryObj &&
          savedQueryObj.query === currentQuery &&
          isEqual(savedQueryObj.params, currentParams)
        )
      })
      toast.push({
        closable: true,
        status: 'warning',
        title: t('save-query.already-saved'),
        description: `${duplicateQuery?.title} - ${formatDate(duplicateQuery?.savedAt || '')}`,
      })
      return
    }

    if (newUrl) {
      // @ts-expect-error why doesn't Omit work?
      const savedQuery = await saveQuery({
        url: newUrl,
        savedAt: new Date().toISOString(),
        title: 'Untitled',
      })
      // Set the selected URL to the newly saved query's URL
      setSelectedUrl(newUrl)
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
  }, [
    queries,
    saveQuery,
    saveQueryError,
    toast,
    t,
    currentQuery,
    currentParams,
    getStateFromUrl,
    generateUrl,
  ])

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

  const handleUpdate = useCallback(
    async (query: QueryConfig) => {
      const newUrl = generateUrl(currentQuery, currentParams)

      // Check for duplicates by comparing query content and params
      const isDuplicate = queries?.some((q) => {
        // Skip the current query when checking for duplicates
        if (q._key === query._key) return false
        const savedQueryObj = getStateFromUrl(q.url)
        return (
          savedQueryObj &&
          savedQueryObj.query === currentQuery &&
          isEqual(savedQueryObj.params, currentParams)
        )
      })

      if (isDuplicate) {
        const duplicateQuery = queries?.find((q) => {
          if (q._key === query._key) return false
          const savedQueryObj = getStateFromUrl(q.url)
          return (
            savedQueryObj &&
            savedQueryObj.query === currentQuery &&
            isEqual(savedQueryObj.params, currentParams)
          )
        })
        toast.push({
          closable: true,
          status: 'warning',
          title: t('save-query.already-saved'),
          description: `${duplicateQuery?.title} - ${formatDate(duplicateQuery?.savedAt || '')}`,
        })
        return
      }

      if (newUrl) {
        try {
          await updateQuery({
            ...query,
            url: newUrl,
            savedAt: new Date().toISOString(),
          })
          setSelectedUrl(newUrl)
          toast.push({
            closable: true,
            status: 'success',
            title: t('save-query.success'),
          })
        } catch (err) {
          toast.push({
            closable: true,
            status: 'error',
            title: t('save-query.error'),
            description: err.message,
          })
        }
      }
    },
    [currentQuery, currentParams, generateUrl, updateQuery, toast, t, queries, getStateFromUrl],
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
          const isSelected = selectedUrl === q.url

          // Compare against current live state
          const areQueriesEqual =
            queryObj && currentQuery === queryObj.query && isEqual(currentParams, queryObj.params)

          const isEdited = isSelected && !areQueriesEqual
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
              style={{position: 'relative'}}
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
                      <Box
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--card-focus-ring-color)',
                        }}
                      />
                    )}
                  </Flex>
                  <MenuButton
                    button={<EllipsisVerticalIcon />}
                    id={`${q._key}-menu`}
                    menu={
                      <Menu
                        style={{background: 'white', backgroundColor: 'white', borderRadius: '11%'}}
                      >
                        <MenuItem
                          padding={0}
                          radius={3}
                          style={{background: 'transparent', backgroundColor: 'transparent'}}
                        >
                          <Button
                            mode="bleed"
                            style={{background: 'transparent', backgroundColor: 'transparent'}}
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
                        </MenuItem>
                      </Menu>
                    }
                    popover={{portal: true, placement: 'bottom-end'}}
                  />
                </Flex>

                <Code muted>{queryObj?.query.split('{')[0]}</Code>

                <Flex align="center" gap={1}>
                  <Text size={1} muted>
                    {formatDate(q.savedAt)}
                  </Text>
                </Flex>

                {isEdited && (
                  <Button
                    mode="ghost"
                    tone="default"
                    size={1}
                    padding={2}
                    style={{
                      height: '24px',
                      position: 'absolute',
                      right: '16px',
                      bottom: '16px',
                      fontSize: '12px',
                    }}
                    text={t('action.update')}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUpdate(q)
                    }}
                  />
                )}
              </Stack>
            </Card>
          )
        })}
      </Stack>
    </ScrollContainer>
  )
}
