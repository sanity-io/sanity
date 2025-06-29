import {AddIcon, SearchIcon, TrashIcon} from '@sanity/icons'
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
import {vars} from '@sanity/ui/css'
import {isEqual} from 'lodash'
import {type ReactElement, useCallback, useState} from 'react'
import {ContextMenuButton, useDateTimeFormat, useTranslation} from 'sanity'

import {type QueryConfig, useSavedQueries} from '../hooks/useSavedQueries'
import {visionLocaleNamespace} from '../i18n'
import {FixedHeader, ScrollContainer} from './QueryRecall.styled'
import {type ParsedUrlState} from './VisionGui'

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
  const formatDate = useDateTimeFormat({
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [optimisticTitles, setOptimisticTitles] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUrl, setSelectedUrl] = useState<string | undefined>(url)

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
        description: `${duplicateQuery?.title} - ${formatDate.format(new Date(duplicateQuery?.savedAt || ''))}`,
      })
      return
    }

    if (newUrl) {
      await saveQuery({
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
    saveQueryError,
    toast,
    t,
    currentQuery,
    currentParams,
    getStateFromUrl,
    generateUrl,
    formatDate,
    saveQuery,
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
          description: `${duplicateQuery?.title} - ${formatDate.format(
            new Date(duplicateQuery?.savedAt || ''),
          )}`,
        })
        return
      }

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
    },
    [
      currentQuery,
      currentParams,
      formatDate,
      generateUrl,
      updateQuery,
      toast,
      t,
      queries,
      getStateFromUrl,
    ],
  )

  const filteredQueries = queries?.filter((q) => {
    return q?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <ScrollContainer>
      <FixedHeader space={3}>
        <Flex padding={2} paddingBottom={0} justify="space-between" align="center">
          <Box padding={3}>
            <Text weight="semibold" style={{textTransform: 'capitalize'}} size={1}>
              {t('label.saved-queries')}
            </Text>
          </Box>
          <Button
            // @ts-expect-error - TODO: fix this
            label={t('action.save-query')}
            icon={AddIcon}
            disabled={saving}
            onClick={handleSave}
            mode="bleed"
          />
        </Flex>
        <Box padding={3} paddingTop={0}>
          <TextInput
            border={false}
            fontSize={1}
            placeholder={t('label.search-queries')}
            icon={SearchIcon}
            padding={2}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
          />
        </Box>
      </FixedHeader>
      <Stack>
        {filteredQueries?.map((q) => {
          const queryObj = getStateFromUrl(q.url)
          const isSelected = selectedUrl === q.url

          // Compare against current live state
          const areQueriesEqual =
            queryObj && currentQuery === queryObj.query && isEqual(currentParams, queryObj.params)

          const isEdited = isSelected && !areQueriesEqual
          return (
            <Card
              as="button"
              key={q._key}
              width={'fill'}
              padding={4}
              // border
              // tone={isSelected ? 'primary' : 'default'}
              onClick={() => {
                setSelectedUrl(q.url) // Update the selected query immediately
                const parsedUrl = getStateFromUrl(q.url)
                if (parsedUrl) {
                  setStateFromParsedUrl(parsedUrl)
                }
              }}
              selected={isSelected}
              style={{position: 'relative'}}
            >
              <Stack gap={3}>
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
                        size={1}
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
                          backgroundColor: vars.color.focusRing,
                        }}
                      />
                    )}
                  </Flex>
                  <MenuButton
                    button={<ContextMenuButton />}
                    id={`${q._key}-menu`}
                    menu={
                      <Menu
                      // style={{background: 'white', backgroundColor: 'white', borderRadius: '11%'}}
                      >
                        <MenuItem
                          tone="critical"
                          padding={3}
                          icon={TrashIcon}
                          text={t('action.delete')}
                          onClick={(event) => {
                            event.stopPropagation()
                            deleteQuery(q._key)
                          }}
                        />
                      </Menu>
                    }
                    popover={{portal: true, placement: 'bottom-end', tone: 'default'}}
                  />
                </Flex>

                <Code size={1}>{queryObj?.query.split('{')[0]}</Code>

                <Flex align="center" gap={1}>
                  <Text size={1} muted>
                    {formatDate.format(new Date(q.savedAt || ''))}
                  </Text>
                </Flex>

                {isEdited && (
                  <Button
                    mode="ghost"
                    tone="default"
                    fontSize={1}
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
