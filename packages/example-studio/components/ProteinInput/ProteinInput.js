import PropTypes from 'prop-types'
import React from 'react'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import {PatchEvent, unset, set, setIfMissing} from 'part:@sanity/form-builder/patch-event'
import {io, Viewer} from 'bio-pv'
import Select from 'part:@sanity/components/selects/default'
import TextField from 'part:@sanity/components/textfields/default'
import Button from 'part:@sanity/components/buttons/default'
import Spinner from 'part:@sanity/components/loading/spinner'
import ActivateOnFocus from 'part:@sanity/components/utilities/activate-on-focus'
import PDBS from './PDBS'

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
  doubleClick: null
}

const DEFAULT_PDB = PDBS[0].id

const getAttr = (value, propName) => value && value[propName]

export default class ProteinInput extends React.Component {
  static propTypes = {
    type: PropTypes.shape({
      title: PropTypes.string
    }).isRequired,
    value: PropTypes.shape({
      _type: PropTypes.string,
      pdb: PropTypes.string,
      camera: PropTypes.shape({
        rotation: PropTypes.arrayOf(PropTypes.number),
        center: PropTypes.arrayOf(PropTypes.number),
        zoom: PropTypes.number
      })
    }),
    level: PropTypes.number,
    onChange: PropTypes.func.isRequired
  }

  state = {
    isLoading: true
  }

  componentDidMount() {
    const {value} = this.props
    this.viewer = new Viewer(this._viewerElement, VIEWER_OPTIONS)
    this._viewerElement.addEventListener('mousemove', this.handleMouseMove)
    this._viewerElement.addEventListener('mousewheel', this.handleMouseWheel)
    this.loadPdb((value && value.pdb) || DEFAULT_PDB)
  }

  componentWillUnmount() {
    this._viewerElement.removeEventListener('mousemove', this.handleMouseMove)
    this._viewerElement.removeEventListener('mousewheel', this.handleMouseWheel)
    this.viewer.destroy()
  }

  componentDidUpdate(prevProps) {
    const camera = getAttr(this.props.value, 'camera')

    const prevPdb = getAttr(prevProps.value, 'pdb')
    const pdb = getAttr(this.props.value, 'pdb')

    if (prevPdb !== pdb) {
      this.loadPdb(pdb)
      return
    }
    if (camera) {
      this.updateViewerCamera(camera)
    } else {
      this.resetViewerCamera()
    }
  }

  loadPdb(id) {
    this.setState({
      isLoading: true
    })
    this.viewer.clear()
    io.fetchPdb(`//www.rcsb.org/pdb/files/${id}.pdb`, structure => {
      const ligand = structure.select({rnames: ['SAH', 'RVP']})
      this.viewer.spheres('structure.ligand', ligand, {})
      this.viewer.cartoon('structure.protein', structure, {boundingSpheres: false})
      this.setState({
        isLoading: false
      })
    })
  }

  updateViewerCamera = camera => {
    this.viewer.setCamera(camera.rotation, camera.center, camera.zoom)
  }

  resetViewerCamera = () => {
    this.viewer.autoZoom()
  }

  handleMouseMove = () => {
    if (this.viewer._redrawRequested) {
      this.saveCamera()
    }
  }

  handleMouseWheel = () => {
    if (this.viewer._redrawRequested) {
      this.saveCamera()
    }
  }

  saveCamera = () => {
    const {onChange, type} = this.props
    const {_rotation, _center, _zoom} = this.viewer._cam
    onChange(
      PatchEvent.from([
        setIfMissing({_type: type.name, pdb: DEFAULT_PDB}),
        set(
          {
            rotation: Array.from(_rotation),
            center: Array.from(_center),
            zoom: _zoom
          },
          ['camera']
        )
      ])
    )
  }

  handleSelectChange = item => {
    this.setPdb(item.id)
  }

  handlePdbStringChange = event => {
    const pdbId = event.target.value
    if (pdbId && pdbId.length === 4) {
      this.setPdb(pdbId)
    }
  }

  handleResetCamera = () => {
    this.props.onChange(PatchEvent.from([unset(['camera'])]))
  }

  setPdb(pdbId) {
    const {onChange, type} = this.props
    onChange(PatchEvent.from([set({_type: type.name, pdb: pdbId})]))
  }

  getPdbById = id => {
    return PDBS.find(item => item.id === id)
  }

  setViewerElement = element => {
    this._viewerElement = element
  }

  render() {
    const {value, type, level} = this.props

    const pdbId = (value && value.pdb) || DEFAULT_PDB

    const {isLoading} = this.state

    return (
      <Fieldset legend={type.title} level={level} description={type.description}>
        <Select
          label="Choose existing…"
          items={PDBS}
          onChange={this.handleSelectChange}
          value={this.getPdbById(pdbId)}
        />
        <TextField label="PDB" value={pdbId} onChange={this.handlePdbStringChange} />
        <div style={{height: '500px', width: '100%', position: 'relative', overflow: 'hidden'}}>
          {isLoading && (
            <div
              style={{
                zIndex: 100,
                backgroundColor: 'rgba(255,255,255,0.8)',
                width: '100%',
                height: '100%'
              }}
            >
              <Spinner center />
            </div>
          )}
          <ActivateOnFocus>
            <div ref={this.setViewerElement} />
          </ActivateOnFocus>
        </div>
        <Button onClick={this.handleResetCamera}>Reset camera</Button>
      </Fieldset>
    )
  }
}
