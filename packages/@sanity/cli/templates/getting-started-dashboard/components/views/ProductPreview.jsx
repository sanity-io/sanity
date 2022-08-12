import React, {useState} from 'react'
import {Box, Button, Flex, Label, Heading, Text, Stack, Select} from '@sanity/ui'
import PropTypes from 'prop-types'
import {BlockText} from './BlockText'
import {Layout, Picture} from './components'

/**
 * Renders thecurrently displayed document as formatted JSON as a
 * simple little "webpage" using:
 * - @sanity/ui
 * - @portabletext/react
 * - @sanity/image-url
 */
export function ProductPreview(props) {
  const document = props.document.displayed
  if (!document) {
    return null
  }
  return <ProductPreviewInner document={document} />
}

export function ProductPreviewInner({document}) {
  const {name, description, variants, material} = document
  const [currentVariant, setCurrentVariant] = useState(variants ? variants[0] : undefined)

  const onValueChange = (event) => {
    const variant = variants.find((v) => v.name === event.currentTarget.value)

    setCurrentVariant(variant)
  }

  return (
    <Layout>
      <Stack space={5} paddingX={4}>
        <Box>
          <Picture picture={currentVariant?.picture} size={400} />
          {currentVariant?.picture?.caption && (
            <Box marginY={3}>
              <Label as="p" align="center">
                {currentVariant?.picture?.caption}
              </Label>
            </Box>
          )}
        </Box>

        <Heading size={4}>{name ?? 'Gimme a name!'}</Heading>

        <Flex gap={2}>
          <Box flex={1}>
            <Stack space={3}>
              <Label>Price</Label>
              <Text>{currentVariant?.price ? `$${currentVariant?.price}` : 'Not set'}</Text>
            </Stack>
          </Box>
          <Box flex={[3]}>
            <Stack space={3}>
              <Label>Material</Label>
              <Text as="p">{material || '-'}</Text>
            </Stack>
          </Box>
        </Flex>

        <Stack space={4}>
          {variants && (
            <Flex gap={4}>
              <Stack space={3}>
                <Label>Variant</Label>
                <Select
                  padding={[3, 3, 4]}
                  space={[3, 3, 4]}
                  onChange={onValueChange}
                  value={currentVariant?.name || undefined}
                >
                  {variants.map((variant) => {
                    return (
                      <option key={variant.id} value={variant.name}>
                        {variant.name}
                      </option>
                    )
                  })}
                </Select>
              </Stack>
              <Stack space={3}>
                <Label>Size</Label>
                {currentVariant?.size?.length ? (
                  <Select padding={[3, 3, 4]} space={[3, 3, 4]}>
                    {currentVariant.size.map((size) => (
                      <option key={size.id} value={size}>
                        {size}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Box align="center">Single size</Box>
                )}
              </Stack>
            </Flex>
          )}

          <Flex gap={4}>
            <Box flex={1}>
              <Select padding={[3, 3, 4]} space={[3, 3, 4]} value="1">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </Select>
            </Box>
            <Box display="flex" flex={3}>
              <Button align="center" text="Add to Cart" style={{width: '100%'}} />
            </Box>
          </Flex>
        </Stack>

        {description?.length && <BlockText value={description} />}
      </Stack>
    </Layout>
  )
}

ProductPreview.propTypes = {
  document: PropTypes.shape({
    displayed: PropTypes.object,
    draft: PropTypes.object,
    published: PropTypes.object,
  }),
}

ProductPreview.propTypes = {
  doc: PropTypes.object,
}
