import PropTypes from 'prop-types'
import React from 'react'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import PatchEvent, {set} from '@sanity/form-builder/PatchEvent'
import {Viewer, io, viewpoint, color} from 'bio-pv'
import {debounce, values, get} from 'lodash'
import Select from 'part:@sanity/components/selects/default'
import TextField from 'part:@sanity/components/textfields/default'
import Button from 'part:@sanity/components/buttons/default'
import Spinner from 'part:@sanity/components/loading/spinner'
import ActivateOnFocus from 'part:@sanity/components/utilities/activate-on-focus'
// import fetch from 'fetch'

const pdbs = [
  {
    title: ''
  },
  {
    title: 'Adenovirus',
    pdb: '3IYN'
  },
  {
    title: 'Insect Flight Muscle',
    pdb: '2W49'
  },
  {
    title: '4HHB',
    pdb: '4HHB'
  },
  {
    title: 'Crystal structure of Myosin VIIa ',
    pdb: '5WSU'
  },
  {
    title: 'Protonation-mediated structural flexibility in the F conjugation regulatory protein.',
    pdb: '2G7O'
  },
  {
    title: 'Escherichia coli Hfq-RNA',
    pdb: '4PNO'
  }
]

const options = {
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

export default class ProteinInput extends React.Component {
  static propTypes = {
    type: PropTypes.shape({
      title: PropTypes.string
    }).isRequired,
    value: PropTypes.object,
    level: PropTypes.number,
    onChange: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    this.state = {
      isLoading: (props.value && props.value.pdb),
      pdb: (props.value && props.value.pdb) || '1R6A',
      newPdb: false
    }
  }

  componentDidMount() {
    this.structure = ''
    this.fetchPdb(this.state.pdb)
    // this.loadPDB('1r6a')
    this.viewer = new Viewer(this._viewerElement, options)
    this._viewerElement.addEventListener('mousemove', this.mouseMoveHandler)
    this._viewerElement.addEventListener('mousewheel', this.mouseWheelHandler)
  }


  componentWillUnmount() {
    this._viewerElement.removeEventListener('mousemove', this.mouseMoveHandler)
    this._viewerElement.removeEventListener('mousewheel', this.mouseWheelHandler)
    this.viewer.destroy()
  }

  componentWillReceiveProps(nextProps) {
    const nextPdb = get(nextProps, 'value.pdb')
    const currentPdb = get(this.props, 'value.pdb')

    if (nextPdb !== currentPdb) {
      this.fetchPdb(nextPdb)
      this.setState({pdb: nextPdb})
      this.handleResetCamera()
    }
  }

  componentDidUpdate(prevProps) {
    const newCamera = get(this.props, 'value.camera')
    const prevCamera = get(prevProps, 'value.camera')

    if (newCamera !== prevCamera) {
      if (newCamera) {
        this.updateCamera(newCamera)
      }
    }

    if (!newCamera) {
      this.handleResetCamera()
    }
  }

  fetchPdb = id => {
    const url = `http://www.rcsb.org/pdb/files/${id}.pdb`

    this.setState({
      isLoading: true
    })

    io.fetchPdb(url, struct => {
      this.structure = struct
      this.preset()
      this.viewer.on('viewerReady', viewer => {
        if (get(this, 'props.value.camera') && !this.state.newPdb) {
          this.updateCamera(this.props.value.camera)
        } else {
          viewer.autoZoom()
        }
        this.setState({
          isLoading: false
        })
      })
    })
  }

  updateCamera = camera => {
    this.viewer.setCamera(
      values(camera.rotation),
      values(camera.center),
      camera.zoom
    )
  }

  handleResetCamera = () => {
    this.viewer.autoZoom()
    this.saveCamera(this.viewer._cam)
  }

  mouseMoveHandler = () => {
    if (this.viewer._redrawRequested) {
      this.saveCamera(this.viewer._cam)
    }
  }

  mouseWheelHandler = event => {
    if (this.viewer._redrawRequested) {
      this.saveCamera(this.viewer._cam)
    }
  }

  saveCamera = debounce(cam => {
    const {onChange} = this.props
    const {_rotation, _center, _zoom} = cam
    onChange(PatchEvent.from([
      set(_rotation, ['camera.rotation']),
      set(_center, ['camera.center']),
      set(_zoom, ['camera.zoom'])
    ]))
  }, 1000 / 3)

  cartoon = () => {
    this.viewer.clear()
    const go = this.viewer.cartoon('structure', this.structure, {
      color: color.ssSuccession(), showRelated: '1',
    })
    const rotation = viewpoint.principalAxes(go)
    this.viewer.setRotation(rotation)
  }

  spheres = () => {
    this.viewer.clear()
    this.viewer.spheres('structure', this.structure, {showRelated: '1'})
  }

  preset = () => {
    this.viewer.clear()
    const ligand = this.structure.select({rnames: ['SAH', 'RVP']})
    this.viewer.spheres('structure.ligand', ligand, {})
    this.viewer.cartoon('structure.protein', this.structure, {boundingSpheres: false})
  }

  setViewerElement = element => {
    this._viewerElement = element
  }

  handleSelectChange = item => {
    const {onChange} = this.props
    onChange(PatchEvent.from([
      set(item.pdb, ['pdb'])
    ]))
  }

  handlePdbChange = pdb => {
    const {onChange} = this.props
    this.viewer.autoZoom()
    this.setState({
      newPdb: true
    })
    onChange(PatchEvent.from([
      set(pdb, ['pdb'])
    ]))
  }

  handlePdbStringChange = event => {
    const {onChange} = this.props
    const pdb = event.target.value
    this.setState({
      pdb: pdb
    })
    if (pdb && (pdb.length === 4)) {
      this.setState({
        newPdb: true
      })
      onChange(PatchEvent.from([
        set(pdb, ['pdb'])
      ]))
    }
  }

  getPdbItem = pdb => {
    if (!pdb) {
      return pdbs[0]
    }
    return pdbs.find(item => {
      return item.pdb === pdb
    })
  }

  render() {
    const {type, level} = this.props
    const {isLoading, pdb} = this.state

    return (
      <Fieldset
        legend={type.title}
        level={level}
        description={type.description}
      >
        <Select label="Choose existing…" items={pdbs} onChange={this.handleSelectChange} value={this.getPdbItem(pdb)} />
        <TextField label="PDB" value={pdb} onChange={this.handlePdbStringChange} />
        <div style={{height: '500px', width: '100%', position: 'relative', overflow: 'hidden'}}>
          {
            isLoading && <div style={{zIndex: 100, backgroundColor: 'rgba(255,255,255,0.8)', width: '100%', height: '100%'}}>
              <Spinner center />
            </div>
          }
          <ActivateOnFocus>
            <div ref={this.setViewerElement} />
          </ActivateOnFocus>
        </div>
        <Button onClick={this.handleResetCamera}>Reset camera</Button>
      </Fieldset>
    )
  }
}
