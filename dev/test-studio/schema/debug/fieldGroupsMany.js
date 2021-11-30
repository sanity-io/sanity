import {CogIcon} from '@sanity/icons'

const arr = (n) => Array.from(Array(n).keys())

const groups = () =>
  arr(10).map((n, i) => ({
    name: `group${i + 1}`,
    title: `Group ${i + 1}`,
    isDefault: i === 8,
    icon: CogIcon,
  }))

const fields = () =>
  arr(10).map((f, i) => ({name: `field${i + 1}`, type: 'string', group: `group${i + 1}`}))

export default {
  name: 'fieldGroupsMany',
  title: 'Many groups',
  type: 'document',
  groups: groups(),
  fields: fields(),
}
