import React from 'react'
import {PortableText} from '@portabletext/react'
import {Card, Text, Heading, Stack, Box} from '@sanity/ui'
import PropTypes from 'prop-types'
import {urlFor} from '../../helpers/image-url-builder'
import {Products, Image} from './blocks'

const textComponents = {
  types: {
    image: ({value}) =>
      value?.asset ? (
        <Card radius={6} overflow="hidden" display="flex" flex={1} justify="center">
          <Image src={urlFor(value).width(400).url()} alt="" />
        </Card>
      ) : null,
    products: ({value}) =>
      value?.products ? (
        <Box paddingY={3}>
          <Products heading="Favourite toys & treats" products={value?.products} />
        </Box>
      ) : null,
  },
  block: {
    normal: ({children}) => <Text as="p">{children}</Text>,
    h2: ({children}) => (
      <Heading as="h2" weight="bold">
        {children}
      </Heading>
    ),
    h3: ({children}) => (
      <Heading as="h3" weight="bold">
        {children}
      </Heading>
    ),
  },
}

export function BlockText(props) {
  const {value} = props

  if (!value) {
    return null
  }
  return (
    <Stack space={5}>
      <PortableText value={value} components={textComponents} />
    </Stack>
  )
}

BlockText.propTypes = {
  value: PropTypes.object,
}
