import React from 'react'
import {PatchEvent, unset, set, setIfMissing} from '@sanity/base/form'
import {io, Viewer} from 'bio-pv'
import {FormFieldSet} from '@sanity/base/components'
import {Button, Select, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import {ObjectSchemaType} from '@sanity/types'
import PDBS from './PDBS'

interface CameraValue {
  rotation: number[]
  center: number[]
  zoom: number
}

interface ProteinInputProps {
  level: number
  onChange: (event: PatchEvent) => void
  type: ObjectSchemaType
  value?: {
    _type: unknown
    pdb: string
    camera?: CameraValue
  }
}

const VIEWER_OPTIONS = {
  width: 'auto',
  height: '500',
  antialias: true,
  fog: true,
  outline: true,
  quality: 'high',
  style: 'phong',
  selectionColor: 'white',
  transparency: 'screendoor',
  background: '#fff',
  animateTime: 500,
  doubleClick: null,
}

const DEFAULT_PDB = PDBS[0].id

export default class ProteinInput extends React.Component<ProteinInputProps> {
  viewer?: Viewer
  _viewerElement?: HTMLDivElement

  state = {
    isLoading: true,
  }

  componentDidMount() {
    const {value} = this.props

    this.viewer = this._viewerElement && new Viewer(this._viewerElement, VIEWER_OPTIONS)
    this._viewerElement?.addEventListener('mousemove', this.handleMouseMove)
    this._viewerElement?.addEventListener('mousewheel', this.handleMouseWheel)
    this.loadPdb(value?.pdb || DEFAULT_PDB)
  }

  componentWillUnmount() {
    this._viewerElement?.removeEventListener('mousemove', this.handleMouseMove)
    this._viewerElement?.removeEventListener('mousewheel', this.handleMouseWheel)
    this.viewer?.destroy()
  }

  componentDidUpdate(prevProps: ProteinInputProps) {
    const camera = this.props.value?.camera
    // const camera = getAttr(this.props.value, 'camera')

    // const prevPdb = getAttr(prevProps.value, 'pdb')
    const prevPdb = prevProps.value?.pdb
    const pdb = this.props.value?.pdb

    if (prevPdb !== pdb && pdb) {
      this.loadPdb(pdb)
      return
    }

    if (camera) {
      this.updateViewerCamera(camera)
    } else {
      this.resetViewerCamera()
    }
  }

  loadPdb(id: string) {
    this.setState({
      isLoading: true,
    })
    this.viewer?.clear()
    io.fetchPdb(`//www.rcsb.org/pdb/files/${id}.pdb`, (structure) => {
      const ligand = structure.select({rnames: ['SAH', 'RVP']})
      this.viewer?.spheres('structure.ligand', ligand, {})
      this.viewer?.cartoon('structure.protein', structure, {boundingSpheres: false})
      this.setState({
        isLoading: false,
      })
    })
  }

  updateViewerCamera = (camera: CameraValue) => {
    this.viewer?.setCamera(camera.rotation, camera.center, camera.zoom)
  }

  resetViewerCamera = () => {
    this.viewer?.autoZoom()
  }

  handleMouseMove = () => {
    if (this.viewer?._redrawRequested) {
      this.saveCamera()
    }
  }

  handleMouseWheel = () => {
    if (this.viewer?._redrawRequested) {
      this.saveCamera()
    }
  }

  saveCamera = () => {
    const {onChange, type} = this.props

    const nextCamera = this.viewer?._cam

    if (!nextCamera) return

    const {_rotation, _center, _zoom} = nextCamera

    onChange(
      PatchEvent.from([
        setIfMissing({_type: type.name, pdb: DEFAULT_PDB}),
        set(
          {
            rotation: Array.from(_rotation),
            center: Array.from(_center),
            zoom: _zoom,
          },
          ['camera']
        ),
      ])
    )
  }

  handleSelectChange = (item: React.ChangeEvent<HTMLSelectElement>) => {
    const nextPdb = item.currentTarget.value

    this.setPdb(nextPdb)
  }

  handlePdbStringChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const pdbId = event.target.value
    if (pdbId && pdbId.length === 4) {
      this.setPdb(pdbId)
    }
  }

  handleResetCamera = () => {
    this.props.onChange(PatchEvent.from([unset(['camera'])]))
  }

  setPdb(pdbId: string) {
    const {onChange, type} = this.props
    onChange(PatchEvent.from([set({_type: type.name, pdb: pdbId})]))
  }

  getPdbById = (id: string) => {
    return PDBS.find((item) => item.id === id)
  }

  setViewerElement = (element: HTMLDivElement) => {
    this._viewerElement = element
  }

  render() {
    const {value, type, level} = this.props

    const pdbId = (value && value.pdb) || DEFAULT_PDB

    const {isLoading} = this.state

    return (
      <FormFieldSet title={type.title} level={level} description={type.description}>
        <Select
          label="Choose existing…"
          // items={PDBS}
          onChange={this.handleSelectChange}
          value={this.getPdbById(pdbId)?.id || ''}
        >
          {PDBS.map((pdb) => (
            <option key={pdb.id} value={pdb.id}>
              {pdb.title}
            </option>
          ))}
        </Select>
        {/* <TextField label="PDB" value={pdbId} onChange={this.handlePdbStringChange} /> */}
        <Stack as="label" space={3}>
          <Text size={1} weight="semibold">
            PDB
          </Text>
          <TextInput onChange={this.handlePdbStringChange} value={pdbId} />
        </Stack>
        <div style={{height: '500px', width: '100%', position: 'relative', overflow: 'hidden'}}>
          {isLoading && (
            <div
              style={{
                zIndex: 100,
                backgroundColor: 'rgba(255,255,255,0.8)',
                width: '100%',
                height: '100%',
              }}
            >
              <Spinner />
            </div>
          )}
          <div ref={this.setViewerElement} />
        </div>
        <Button onClick={this.handleResetCamera} text="Reset camera" />
      </FormFieldSet>
    )
  }
}
