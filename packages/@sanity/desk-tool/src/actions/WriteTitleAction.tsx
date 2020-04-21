/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-no-bind */

import {useDocumentOperation} from '@sanity/react-hooks'

export function WriteTitleAction(docInfo) {
  if (docInfo.isLiveEditEnabled) {
    return null
  }

  const {patch, commit}: any = useDocumentOperation(docInfo.id, docInfo.type)

  return {
    label: 'Set title to foo!',
    onHandle: () => {
      patch.execute([{set: {title: 'foo'}}])
      commit.execute()
    }
  }
}
