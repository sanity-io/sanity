import {ClockIcon} from '@sanity/icons'
import {Box, Button, MenuItem} from '@sanity/ui'
import React, {useCallback} from 'react'
import {SchemaType} from '@sanity/types'
import {RecentSearch} from './local-storage/search-store'

export interface RecentSearchesProps {
  value: RecentSearch
  onClick: (value: RecentSearch) => void
}

export function RecentSearchItem(props: RecentSearchesProps) {
  const {value, onClick} = props
  const handleRecentSearchClick = useCallback(() => {
    onClick(value)
  }, [value, onClick])

  return (
    <MenuItem onClick={handleRecentSearchClick}>
      <Button
        as={'a'}
        style={{width: '100%'}}
        justify={'flex-start'}
        mode="bleed"
        icon={ClockIcon}
        text={
          <Box wrap="wrap" style={{whiteSpace: 'normal'}}>
            <strong>"{value.query}"</strong> in <TypeNames types={value.types} />
          </Box>
        }
      />
    </MenuItem>
  )
}

function typeTitle(schemaType: SchemaType) {
  return schemaType.title ?? schemaType.name
}

function TypeNames({types}: {types: SchemaType[]}) {
  if (!types.length) {
    return <>all document types</>
  }
  if (types.length === 1) {
    return <strong>{typeTitle(types[0])}</strong>
  }
  return (
    <>
      {types.map((schemaType, i) => {
        const title = typeTitle(schemaType)
        const element = <strong key={title}>{title}</strong>
        if (i < types.length - 2) {
          return <React.Fragment key={title}>{element}, </React.Fragment>
        } else if (i === types.length - 1) {
          return <React.Fragment key={title}> and {element}</React.Fragment>
        }
        return element
      })}
    </>
  )
}
