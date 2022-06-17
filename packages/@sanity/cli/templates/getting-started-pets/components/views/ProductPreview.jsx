import React, { useState, useCallback } from "react";
import {
  Box,
  Button,
  Flex,
  Label,
  Heading,
  Text,
  Card,
  Grid,
  Container,
  Stack,
  Select,
  Avatar,
} from "@sanity/ui";
import PropTypes from "prop-types";
import { urlFor } from "../../helpers/image-url-builder";
import { BlockText } from "./BlockText";
import {
  useIdPair,
  useListeningQuery,
} from "../../plugins/listening-query/listening-query-hook";

import { Picture } from "./PetPreviewComponents";
/**
 * Renders thecurrently displayed document as formatted JSON as a
 * simple little "webpage" using:
 * - @sanity/ui
 * - @portabletext/react
 * - @sanity/image-url
 */
export function ProductPreview(props) {
  const doc = props.document.displayed;
  if (!doc) {
    return null;
  }
  return <ProductPreviewInner doc={doc} />;
}

export function ProductPreviewInner({ doc }) {
  const { name, description, variants, price, material } = doc;
  const [currentVariant, setCurrentVariant] = useState(
    variants ? variants[0] : undefined
  );

  const onValueChange = (event) => {
    const variant = variants.find((v) => v.name === event.currentTarget.value);

    setCurrentVariant(variant);
  };

  return (
    <Flex direction="column" gap={5} padding={4} maxLength={20}>
      <Flex direction="column">
        <Box>
          <Picture
            picture={currentVariant?.picture}
            size={400}
            borderPercentage={10}
          />
          {currentVariant?.picture?.caption && (
            <Box marginLeft={5} marginY={3}>
              <Label>{currentVariant?.picture?.caption}</Label>
            </Box>
          )}
        </Box>
      </Flex>

      <Heading size={4}>{name ?? "Gimme a name!"}</Heading>

      <Flex gap={2}>
        <Card flex={1}>
          <Stack space={3}>
            <Label>Price</Label>
            <Text>
              {currentVariant?.price ? `$${currentVariant?.price}` : "not set"}
            </Text>
          </Stack>
        </Card>
        <Card flex={[1, 2, 3]} marginLeft={[2, 2, 3, 4]}>
          <Stack space={3}>
            <Label>Material</Label>
            <Text>{material || "-"}</Text>
          </Stack>
        </Card>
      </Flex>

      {variants && (
        <Flex gap={2}>
          <Card flex={3}>
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
                  );
                })}
              </Select>
            </Stack>
          </Card>
          <Card flex={[2, 2, 3]} marginLeft={[2, 2, 3, 4]}>
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
                "single size"
              )}
            </Stack>
          </Card>
        </Flex>
      )}

      <Flex gap={2}>
        <Card flex={1}>
          <Stack space={3}>
            <Select padding={[3, 3, 4]} space={[3, 3, 4]} value="1">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </Select>
          </Stack>
        </Card>
        <Card flex={[1, 2, 3]} marginLeft={[2, 2, 3, 4]}>
          <Stack space={3}>
            <Button>Add to Cart</Button>
          </Stack>
        </Card>
      </Flex>

      {description?.length && (
        <Flex>
          <Card>
            <BlockText value={description} />
          </Card>
        </Flex>
      )}
    </Flex>
  );
}

ProductPreview.propTypes = {
  document: PropTypes.shape({
    displayed: PropTypes.object,
    draft: PropTypes.object,
    published: PropTypes.object,
  }),
};

ProductPreview.propTypes = {
  doc: PropTypes.object,
};
