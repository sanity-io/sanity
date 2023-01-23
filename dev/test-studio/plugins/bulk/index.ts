import {Tool, definePlugin} from 'sanity'
import {BulkList} from './BulkList'
import {HorizontalForm} from './HorizontalForm'

export const bulkTool: Tool = {
  name: 'bulk',
  title: 'bulk',
  component: BulkList,
}

export default definePlugin({
  name: 'Bulk List',
  tools: [bulkTool],
  form: {
    components: {
      input: HorizontalForm,
    },
  },
})
