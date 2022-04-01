import {SearchIcon} from '@sanity/icons'
import {Autocomplete, Card, Label, Text} from '@sanity/ui'
import React, {forwardRef, useCallback, useMemo, useState} from 'react'
import {useSource} from '../../../source'
import {SanityPreview} from '../../../preview'
import {IntentLink} from '../../../router'
import {useDocumentSearchResults} from '../../../search/useDocumentSearchResults'
import {SearchHit} from '../../../search/weighted/types'

interface SearchResultOption {
  hit: SearchHit
  value: string
}

export function GlobalSearch() {
  const [query, setQuery] = useState<string | null>(null)

  const results = useDocumentSearchResults({
    includeDrafts: true,
    limit: 10,
    query: query || '',
  })

  const options: SearchResultOption[] = useMemo(
    () => results.value.map((item) => ({value: item.hit._id, hit: item.hit})),
    [results]
  )

  const filterOption = useCallback(() => {
    return true
  }, [])

  const renderOption = useCallback((option: SearchResultOption) => {
    return <SearchResultItem documentId={option.hit._id} documentType={option.hit._type} />
  }, [])

  return (
    <Autocomplete
      filterOption={filterOption}
      icon={SearchIcon}
      id="global-search"
      loading={results.loading}
      onQueryChange={setQuery}
      options={options}
      placeholder="Search"
      popover={{scheme: 'light'}}
      radius={2}
      renderOption={renderOption}
      style={{width: 360}}
    />
  )
}

const SearchResultItem = forwardRef(function SearchResultItem(
  props: {
    documentId: string
    documentType: string
  },
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {documentId, documentType, ...restProps} = props
  const source = useSource()
  const schemaType = source.schema.get(documentType)

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function LinkComponent(linkProps, ref: React.ForwardedRef<HTMLAnchorElement>) {
        if (!schemaType) {
          return <a {...linkProps} ref={ref} />
        }

        return (
          <IntentLink
            {...linkProps}
            intent="edit"
            params={{id: documentId, type: schemaType.name}}
            // data-hit-index={resultIndex}
            tabIndex={-1}
            ref={ref}
          />
        )
      }),
    [documentId, schemaType]
  )

  if (!schemaType) {
    return (
      <Card {...restProps} border key={documentId} padding={3} ref={ref} tone="critical">
        <Text size={1}>
          Unknown type: <code>{documentType}</code>
        </Text>
      </Card>
    )
  }

  return (
    <Card
      {...restProps}
      as={LinkComponent}
      data-as="a"
      key={documentId}
      padding={1}
      radius={2}
      ref={ref}
      style={{lineHeight: 0, whiteSpace: 'nowrap'}}
    >
      <SanityPreview
        layout="default"
        type={schemaType}
        status={<Label size={0}>{schemaType.title}</Label>}
        value={{_id: documentId}}
      />
    </Card>
  )
})
