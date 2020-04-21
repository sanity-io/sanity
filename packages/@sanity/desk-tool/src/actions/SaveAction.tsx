/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {useDocumentOperation} from '@sanity/react-hooks'

export function SaveAction({id, type, onComplete}) {
  const {commit}: any = useDocumentOperation(id, type)

  return {
    disabled: Boolean(commit.disabled),
    label: 'Save',
    onHandle: async () => {
      await commit.execute()
      onComplete()
    }
  }
}
