import {SparklesIcon} from '@sanity/icons'
import {useMemo} from 'react'
import {defineDocumentFieldAction} from 'sanity'

import {defineActionGroup, defineActionItem} from './define'
import {PrivateIcon} from './PrivateIcon'

export const assistFieldActionGroup = defineDocumentFieldAction({
  name: 'test/assist',
  useAction({path}) {
    const children = useMemo(
      () => [
        defineActionGroup({
          type: 'group',
          title: 'Run instructions',
          expanded: true,
          children: [
            {
              type: 'action',
              icon: SparklesIcon,
              iconRight: PrivateIcon,
              title: 'Instruction 1',
              onAction() {
                console.log('run 1', path)
              },
            },
            {
              type: 'action',
              icon: SparklesIcon,
              title: 'Instruction 2',
              onAction() {
                console.log('run 2', path)
              },
            },
          ],
        }),
        defineActionItem({
          type: 'action',
          title: 'Manage instructions',
          onAction() {
            console.log('manage', path)
          },
          selected: true,
        }),
      ],
      [path],
    )

    return defineActionGroup({
      type: 'group',
      title: 'Assist',
      icon: SparklesIcon,
      children,
      renderAsButton: true,
    })
  },
})
