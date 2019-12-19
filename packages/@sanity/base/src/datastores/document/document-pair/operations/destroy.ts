import {OperationArgs} from '../../types'

export const destroy = {
  disabled: () => false,
  execute: ({liveEdit, snapshots, idPair, versions, typeName}: OperationArgs) => {
    versions.published.delete()
    versions.published.delete()
  }
}
