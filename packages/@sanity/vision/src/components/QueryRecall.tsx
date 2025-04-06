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

import {useQueryDocument} from '../hooks/useQueryDocument'
import {visionLocaleNamespace} from '../i18n'

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

// ADAM design notes
// -Avoid modals, use a sidebar or a drawer
// -Title/better info for high-level view

// TODO
// -how to delete queries?
// -editable title
// -Add team queries
// -seearch queries
export function QueryRecall({
  url,
  getStateFromUrl,
  setStateFromParsedUrl,
}: {
  url?: string
  getStateFromUrl: (data: string) => any // TODO: any
  setStateFromParsedUrl: any // TODO: any
}) {
  const toast = useToast()
  const {saveQuery, updateQuery, document, deleteQuery, saving, deleting, saveQueryError} =
    useQueryDocument()
  const {t} = useTranslation(visionLocaleNamespace)

  const queries = document?.queries

  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const handleSave = useCallback(async () => {
    if (url && queries?.map((q) => q.url).includes(url)) {
      toast.push({
        closable: true,
        status: 'info',
        title: t('save-query.already-saved'),
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

      await updateQuery({
        ...query,
        title: newTitle,
      })

      if (saveQueryError) {
        toast.push({
          closable: true,
          status: 'error',
          title: t('save-query.error'),
          description: saveQueryError.message,
        })
      }
    },
    [updateQuery, saveQueryError, toast, t],
  )

  return (
    <ScrollContainer>
      <FixedHeader space={3}>
        <Flex padding={3} justify="space-between" align="center">
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
        <Box padding={3}>
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
                setStateFromParsedUrl(getStateFromUrl(q.url))
              }}
            >
              <Stack space={3}>
                <Flex justify="space-between" align={'center'}>
                  <Flex align="center" gap={2}>
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
                      />
                    ) : (
                      <>
                        <Text weight="bold" size={3}>
                          {q.title || q._key.slice(q._key.length - 5, q._key.length)}
                        </Text>
                      </>
                    )}
                  </Flex>
                  <Flex gap={2} align="center">
                    <Badge tone="primary" padding={2} radius={1}>
                      {t('label.personal')}
                    </Badge>
                    <MenuButton
                      button={<EllipsisVerticalIcon />}
                      id="menu-button-example"
                      menu={
                        <Menu>
                          <Button
                            mode="bleed"
                            icon={EditIcon}
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
                      placement="right"
                      popover={{portal: true, placement: 'bottom-end'}}
                    />
                  </Flex>
                </Flex>
                <Text size={2} muted>
                  {queryObj.query.split('{')[0]}
                </Text>
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
