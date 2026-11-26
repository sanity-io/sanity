import {Card} from '@sanity/ui'
import {Text, Flex, VStack} from 'ui5'

import {CircularProgress} from '../CircularProgress'
import {LinearProgress} from '../LinearProgress'

const PERCENTS = [0, 25, 50, 75, 100]

/**
 * Chromatic sentinel for the determinate upload bars: the linear Card bar
 * (translate3d fill, Sanity UI theme blue) and the 43px circular SVG (gray
 * track, blue dashoffset). Used by DefaultPreview, MediaPreview, BlockPreview
 * and UploadProgress. Percentages are fixtures; CSS transitions pause in
 * Chromatic.
 */
export function ProgressStory() {
  return (
    <Card padding={4} style={{maxWidth: 360}}>
      <VStack gap={5}>
        <VStack gap={3}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            linear
          </Text>
          {PERCENTS.map((value) => (
            <VStack gap={2} key={`linear-${value}`}>
              <Text muted size={0} as="div" trim={true}>
                {value}%
              </Text>
              <LinearProgress value={value} />
            </VStack>
          ))}
        </VStack>
        <VStack gap={3}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            circular
          </Text>
          <Flex alignItems="flex-end" gap={4}>
            {PERCENTS.map((value) => (
              <VStack gap={2} key={`circular-${value}`} style={{alignItems: 'center'}}>
                <CircularProgress value={value} />
                <Text muted size={0} as="div" trim={true}>
                  {value}%
                </Text>
              </VStack>
            ))}
          </Flex>
        </VStack>
      </VStack>
    </Card>
  )
}
