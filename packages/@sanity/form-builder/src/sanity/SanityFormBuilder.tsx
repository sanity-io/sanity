import React from 'react'
import SanityFormBuilderContext from './SanityFormBuilderContext'
import {FormBuilderInput} from '../FormBuilderInput'
import {Marker, Type} from '../typedefs'
import {Path} from '../typedefs/path'
import * as gradientPatchAdapter from './utils/gradientPatchAdapter'
import {Tracker, Box} from '@sanity/overlayer'
import {PresenceTransitionRenderer} from './PresenceTransitionRenderer'
import {LoremIpsum} from './overlay-test/LoremIpsum'
import {Dialog, DialogContent} from './overlay-test/Dialog'

type PatchChannel = {
  subscribe: () => () => {}
  receivePatches: (patches: Array<any>) => void
}
type Props = {
  value: any | null
  schema: any
  type: Type
  markers: Array<Marker>
  patchChannel: PatchChannel
  onFocus: (arg0: Path) => void
  readOnly: boolean
  onChange: (patches: any[]) => void
  filterField: (field: any) => boolean
  onBlur: () => void
  autoFocus: boolean
  focusPath: Path
  presence: any
}

export default class SanityFormBuilder extends React.Component<Props, {}> {
  static createPatchChannel = SanityFormBuilderContext.createPatchChannel

  render() {
    return (
      <Dialog>
        <Tracker renderWith={PresenceTransitionRenderer}>
          <h3>Nested overlay container</h3>
          {/*Toggle boolean to switch*/
          true ? (
            // this works!
            <>
              <Box id="one" />
              <LoremIpsum />
              <Box id="two" />
              <LoremIpsum />
              <Box id="three" />
              <LoremIpsum />
              <Box id="four" />
              <LoremIpsum />
              <Box id="five" />
              <LoremIpsum />
            </>
          ) : (
            // this does not!
            <>
              <LoremIpsum />
              <LoremIpsum />
              <Box id="one" />
              <LoremIpsum />
              <LoremIpsum />
              <Box id="two" />
              <LoremIpsum />
            </>
          )}
        </Tracker>
      </Dialog>
    )
  }
}
