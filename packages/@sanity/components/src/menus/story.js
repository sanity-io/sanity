import React from 'react'
import Menu from 'part:@sanity/components/menus/default'
//import StateMenu from 'part:@sanity/components/menus/state'
import {storiesOf, action} from 'part:@sanity/storybook'
import SanityIcon from 'part:@sanity/base/sanity-logo-icon'

storiesOf('Menus')
.addWithInfo(
  'Menu',
  `
    Default menu
  `,
  () => {
    return (
      <div
        style={{
          width: '300px',
          position: 'relative'
        }}
      >
        <Menu
          onAction={action('onAction')}
          onClose={action('onClose')}
          onClickOutside={action('Clicked outside')}
          items={[
            {
              title: 'First item',
              key: '1'
            },
            {
              title: 'Second item',
              key: '1'
            },
            {
              title: 'Third item',
              key: '3'
            },
            {
              title: 'Extra item',
              key: '4',
              divider: true
            }
          ]}
          opened
        />
      </div>
    )
  },
  {
    propTables: [Menu],
    role: 'part:@sanity/components/menus/default'
  }
)
.addWithInfo(
  'Menu (with icons)',
  `
    ## Using icons
  `,
  () => {
    const items = [
      {
        title: 'First item',
        icon: SanityIcon,
        key: '1'
      },
      {
        title: 'Second item',
        icon: SanityIcon,
        key: '2'
      },
      {
        title: 'Third item',
        icon: SanityIcon,
        key: '3'
      },
      {
        kind: 'divider'
      },
      {
        title: 'Extra item',
        key: '4',
        icon: SanityIcon
      }
    ]
    return (
      <div
        style={{
          width: '300px',
          position: 'relative'
        }}
      >
        <Menu
          onAction={action('onAction')}
          onClose={action('onClose')}
          onClickOutside={action('onClickOutside')}
          items={items}
          opened
        />
      </div>
    )
  },
  {
    propTables: [Menu],
    role: 'part:@sanity/components/menus/default'
  }
)

// Commented out intil we have state in storybook or the StateLink fails silently
// .addWithInfo(
//   'State menu',
//   `
//     Takes linkState on item, and the router is called
//   `,
//   () => {
//     const linkState = {
//       Tool: {
//         action: 'edit',
//         selectedType: 'type',
//         selectedDocumentId: 'id'
//       },
//       tool: 'Tool'
//     }
//     return (
//       <div
//         style={{
//           width: '300px',
//           position: 'relative'
//         }}
//       >
//         <StateMenu
//           onAction={action('Clicked item')}
//           onClose={action('onClose')}
//           onClickOutside={action('Clicked outside')}
//           items={[
//             {
//               title: 'First item',
//               linkState: linkState
//             },
//             {
//               title: 'Second item',
//               linkState: linkState
//             },
//             {
//               title: 'Third item',
//               linkState: linkState
//             },
//             {
//               title: 'Extra item',
//               linkState: linkState,
//               divider: true
//             }
//           ]}
//           opened
//         />
//       </div>
//     )
//   },
//   {
//     propTables: [StateMenu],
//     role: 'part:@sanity/components/menus/default'
//   }
// )
