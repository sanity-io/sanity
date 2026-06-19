import {expectTypeOf, test} from 'vitest'

import {type PortableTextPluginsProps} from './blockProps'

test('plugins.markdown accepts spreading the incoming value and overriding `enabled`', () => {
  // A structural assertion misses this: the excess-property error only fires on
  // literal assignment, so the spread is replicated in a real `renderDefault` call.
  expectTypeOf((props: PortableTextPluginsProps) =>
    props.renderDefault({
      ...props,
      plugins: {
        ...props.plugins,
        markdown: {
          ...props.plugins.markdown,
          enabled: false,
        },
      },
    }),
  ).toBeFunction()
})
