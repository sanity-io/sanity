import React, {useState} from 'react'
import {Box, Button, Stack, Text} from '@sanity/ui'

export function TestInputComponent(props: any) {
  const [expand, setExpand] = useState(false)
  return (
    <Box>
      <Stack space={4}>
        <Text>
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Rem iusto repellat debitis optio
          dolorem laborum eveniet vitae vero earum facilis sit tempora quia nobis velit, aperiam
          sint natus accusamus sequi.
        </Text>
        {expand && (
          <Stack space={4}>
            <Text>
              Lorem ipsum dolor sit, amet consectetur adipisicing elit. Rem iusto repellat debitis
              optio dolorem laborum eveniet vitae vero earum facilis sit tempora quia nobis velit,
              aperiam sint natus accusamus sequi.
            </Text>
            <Text>
              Lorem ipsum dolor sit, amet consectetur adipisicing elit. Rem iusto repellat debitis
              optio dolorem laborum eveniet vitae vero earum facilis sit tempora quia nobis velit,
              aperiam sint natus accusamus sequi.
            </Text>
          </Stack>
        )}
        <Button onClick={() => setExpand(!expand)}>Toggle expand</Button>
      </Stack>
    </Box>
  )
}
