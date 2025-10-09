import {AsteriskIcon, CommentIcon, OlistIcon, SchemaIcon} from '@sanity/icons'

import {defineDocumentInspector, type DocumentInspectorMenuItem} from '../../../config'
import {WorkflowsInspector} from './WorkflowsInspector'
// import {useTranslation} from '../../../i18n'
// import {COMMENTS_INSPECTOR_NAME} from '../../constants'
// import {useCommentsEnabled} from '../../hooks'
// import {commentsLocaleNamespace} from '../../i18n'
// import {CommentsInspector} from './CommentsInspector'

function useMenuItem(): DocumentInspectorMenuItem {
  // const {t} = useTranslation(commentsLocaleNamespace)
  // const {enabled} = useCommentsEnabled()

  return {
    // hidden: !enabled,
    // icon: OlistIcon,
    // icon: Progress50Icon
    icon: SchemaIcon,
    showAsAction: true,
    title: 'Workflows',
  }
}

export const workflowsInspector = defineDocumentInspector({
  name: 'sanity/workflows',
  component: WorkflowsInspector,
  useMenuItem,
})
