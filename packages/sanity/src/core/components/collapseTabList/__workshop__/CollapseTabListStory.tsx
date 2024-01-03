import {useState} from 'react'
import {IceCreamIcon} from '@sanity/icons'
import {Card, Flex} from '@sanity/ui'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import {Button} from '../../../../ui-components'
import {CollapseTabList} from '..'

const GAP_OPTIONS = {'0': 0, '1': 1, '2': 2, '3': 3, '4': 4}

export default function CollapseMenuStory() {
  const collapsed = useBoolean('Collapsed', false)
  const gap = useSelect('Gap', GAP_OPTIONS, 1)
  const [selected, setSelected] = useState(0)

  return (
    <Flex align="center" height="fill" justify="center" padding={2}>
      <Card
        shadow={1}
        radius={3}
        padding={1}
        style={{
          overflow: 'hidden',
          resize: 'horizontal',
        }}
      >
        <CollapseTabList gap={gap} collapsed={collapsed}>
          {[...Array(5).keys()].map((num) => (
            <Button
              key={num}
              text={`Button ${num + 1}`}
              icon={IceCreamIcon}
              mode="bleed"
              selected={selected === num}
              // eslint-disable-next-line react/jsx-no-bind
              onClick={() => setSelected(num)}
            />
          ))}
        </CollapseTabList>
      </Card>
    </Flex>
  )
}
