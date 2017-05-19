import React from 'react'
import {search, valueToString} from './client-adapters/reference'
import ReferenceSearchableSelect from '../../inputs/Reference/searchableSelect/ReferenceSearchableSelect'
import EditReferenceDoc from './EditReferenceDoc'
import documentStore from 'part:@sanity/base/datastore/document'
import PatchEvent, {set} from '../../PatchEvent'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'

export default class SanityReferenceInput extends React.Component {
  props: {
    onChange: (event : PatchEvent) => void
  }
  state = {
    isCreating: false,
    edit: null
  }
  handleCreateNew = document => {
    this.setState({
      isCreating: true
    })
    documentStore.create(document)
      .subscribe(created => {
        this.props.onChange(PatchEvent.from(set({_type: 'reference', _ref: created._id})))
        this.setState({
          edit: {_id: created._id, _type: created._type},
          isCreating: false
        })
      })
  }
  handleCloseEditDialog = () => {
    this.setState({edit: null})
  }
  render() {
    const {edit, isCreating} = this.state
    return (
      <div>
        {(edit || isCreating) && (
          <FullscreenDialog isOpen onClose={this.handleCloseEditDialog}>
            {edit && <EditReferenceDoc id={edit._id} typeName={edit._type} />}
            {isCreating && <div>Creating…</div>}
          </FullscreenDialog>
        )}
        <ReferenceSearchableSelect
          {...this.props}
          searchFn={search}
          onCreateNew={this.handleCreateNew}
          valueToStringFn={valueToString}
        />
      </div>
    )
  }
}
