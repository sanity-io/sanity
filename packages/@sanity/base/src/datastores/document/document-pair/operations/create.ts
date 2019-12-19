import {Operation} from '../../types'

const id = <T>(id: T): T => id

export function createCreateOp({liveEdit, published, draft}): Operation<typeof id> {
  return {
    disabled: false,
    execute(document) {
      const version = liveEdit ? published : draft
      version.create(document)
    }
  }
}
