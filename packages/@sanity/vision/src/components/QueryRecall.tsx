import {
  AddIcon,
  ClockIcon,
  EditIcon,
  EllipsisVerticalIcon,
  SearchIcon,
  TrashIcon,
} from '@sanity/icons'
import {
  Badge,
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
import {useCallback, useState} from 'react'
import {useTranslation} from 'sanity'
import styled from 'styled-components'

import {type QueryConfig, useQueryDocument} from '../hooks/useQueryDocument'
import {visionLocaleNamespace} from '../i18n'
import {type ParsedUrlState} from './VisionGui'

const FixedHeader = styled(Stack)`
  position: sticky;
  top: 0;
  background: ${({theme}) => theme.sanity.color.base.bg};
  z-index: 1;
`

const ScrollContainer = styled(Box)`
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({theme}) => theme.sanity.color.base.border};
    border-radius: 4px;
  }
`

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

// TODO
// -how to delete queries?
// -clean up title edit UI
// -Add team queries
// -seearch queries
export function QueryRecall({
  url,
  getStateFromUrl,
  setStateFromParsedUrl,
}: {
  url?: string
  getStateFromUrl: (data: string) => ParsedUrlState | null
  setStateFromParsedUrl: (parsedUrlObj: ParsedUrlState) => void
}) {
  const toast = useToast()
  const {saveQuery, updateQuery, document, deleteQuery, saving, deleting, saveQueryError} =
    useQueryDocument()
  const {t} = useTranslation(visionLocaleNamespace)

  const queries = document?.queries

  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [optimisticTitles, setOptimisticTitles] = useState<Record<string, string>>({})

  const handleSave = useCallback(async () => {
    if (url && queries?.map((q) => q.url).includes(url)) {
      toast.push({
        closable: true,
        status: 'warning',
        title: t('save-query.already-saved'),
        description: `${queries.find((q) => q.url === url)?.title} - ${formatDate(
          queries.find((q) => q.url === url)?.savedAt || '',
        )}`,
      })
      return
    }
    await saveQuery({
      url,
      savedAt: new Date().toISOString(),
      title: 'Untitled',
    })

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
      // Set optimistic title
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
          <TextInput placeholder={t('label.search-queries')} icon={SearchIcon} />
        </Box>
      </FixedHeader>
      <Stack padding={3}>
        {queries?.map((q) => {
          const queryObj = getStateFromUrl(q.url)
          return (
            <Card
              key={q._key}
              width={'fill'}
              padding={4}
              border
              onClick={() => {
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
                        style={{maxWidth: '170px'}}
                      />
                    ) : (
                      <>
                        <Text
                          weight="bold"
                          size={3}
                          textOverflow="ellipsis"
                          style={{maxWidth: '170px'}}
                          title={
                            optimisticTitles[q._key] ||
                            q.title ||
                            q._key.slice(q._key.length - 5, q._key.length)
                          }
                        >
                          {optimisticTitles[q._key] ||
                            q.title ||
                            q._key.slice(q._key.length - 5, q._key.length)}
                        </Text>
                      </>
                    )}
                  </Flex>
                  <Flex gap={2} align="center">
                    <Badge tone="primary" size={1} padding={2} radius={1}>
                      {t('label.personal')}
                    </Badge>
                    <MenuButton
                      button={<EllipsisVerticalIcon />}
                      id={`${q._key}-menu`}
                      menu={
                        <Menu>
                          <Button
                            mode="bleed"
                            icon={EditIcon}
                            width="fill"
                            onClick={(event) => {
                              event.stopPropagation()
                              setEditingKey(q._key)
                              setEditingTitle(q.title || q._key.slice(0, 5))
                            }}
                            text={t('action.edit-title')}
                          />
                          <Button
                            mode="bleed"
                            tone="critical"
                            width="fill"
                            icon={TrashIcon}
                            text={t('action.delete')}
                            onClick={(event) => {
                              event.stopPropagation()
                              deleteQuery(q._key)
                            }}
                            disabled={deleting.includes(q._key)}
                          />
                        </Menu>
                      }
                      popover={{portal: true, placement: 'bottom-end'}}
                    />
                  </Flex>
                </Flex>

                <Code muted>{queryObj?.query.split('{')[0]}</Code>

                <Flex align="center" gap={1}>
                  <ClockIcon />
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
