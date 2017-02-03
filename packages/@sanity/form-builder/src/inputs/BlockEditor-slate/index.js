import React from 'react'
import {Raw, Block, Document, State} from 'slate'
import BlockEditor from './BlockEditor'
import SlateValueContainer from './SlateValueContainer'

const newState = State.create({
  document: Document.create({
    nodes: Block.createList([
      Raw.deserializeNode({
        kind: 'block',
        type: 'normal',
        nodes: [
          {kind: 'text', text: '', ranges: []}
        ]
      })
    ])
  })
})

export default class BlockEditorWrapper extends React.Component {

  state = {
    value: new SlateValueContainer(newState, this.context)
  }

  logValue = event => {
    console.log(this.state.value.serialize())
  }

  handleChange = event => {
    if (event.patch && event.patch.type === 'localState') {
      this.setState({value: this.state.value.patch(event.patch)})
    }
  }

  render() {
    return (
      <div>
        <BlockEditor
          {...this.props}
          value={this.state.value}
          onChange={this.handleChange}
        />
        <button onClick={this.logValue}>Log</button>
      </div>
    )
  }
}
