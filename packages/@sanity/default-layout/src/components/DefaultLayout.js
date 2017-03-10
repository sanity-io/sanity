import React, {PropTypes} from 'react'
import {RouteScope, withRouterHOC} from 'part:@sanity/base/router'
import absolutes from 'all:part:@sanity/base/absolutes'
import SanityStudioLogo from 'part:@sanity/base/sanity-studio-logo'
import styles from './styles/DefaultLayout.css'
import RenderTool from './RenderTool'
import DesktopNavigation from './DesktopNavigation'
import MobileNavigation from './MobileNavigation'
import ToolSwitcher from 'part:@sanity/default-layout/tool-switcher'
import PlusIcon from 'part:@sanity/base/plus-circle-outline-icon'
import ActionModal from './ActionModal'
import schema from 'part:@sanity/base/schema'
import DataAspectsResolver from 'part:@sanity/data-aspects/resolver'

const dataAspects = new DataAspectsResolver(schema)

export default withRouterHOC(class DefaultLayout extends React.Component {
  static propTypes = {
    router: PropTypes.shape({
      state: PropTypes.object,
      navigate: PropTypes.func
    }),
    tools: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string
    }))
  }

  state = {
    createMenuOpen: false
  }

  maybeRedirectToFirstTool() {
    const {router} = this.props
    if (!router.state.tool && this.props.tools.length > 0) {
      router.navigate({tool: this.props.tools[0].name}, {replace: true})
    }
  }

  componentWillMount() {
    this.maybeRedirectToFirstTool()
  }

  componentDidUpdate() {
    this.maybeRedirectToFirstTool()
  }

  handleCreateButtonClick = () => {
    this.setState({
      createMenuOpen: !this.state.createMenuOpen
    })
  }

  handleActionModalClose = () => {
    this.setState({
      createMenuOpen: false
    })
  }

  render() {
    const {tools, router} = this.props
    const {createMenuOpen} = this.state

    const TYPE_ITEMS = dataAspects.getInferredTypes().map(typeName => ({
      key: typeName,
      name: typeName,
      title: dataAspects.getDisplayName(typeName)
    }))

    const modalActions = TYPE_ITEMS.map(item => {
      return {
        title: item.title,
        params: {type: item.name}
      }
    })

    return (
      <div className={styles.defaultLayout}>

        <div className={styles.desktopNavigation}>
          <DesktopNavigation tools={tools} />
        </div>

        <div className={styles.mobileNavigation}>
          <MobileNavigation tools={tools} />
        </div>

        <div className={styles.secondaryNavigation}>
          <a className={styles.createButton} onClick={this.handleCreateButtonClick}>
            <span className={styles.createButtonIcon}><PlusIcon /></span>
            <span className={styles.createButtonText}>Create</span>
          </a>
          <ToolSwitcher
            tools={this.props.tools}
            activeToolName={router.state.tool}
            className={styles.toolSwitcher}
          />
        </div>

        <div className={styles.toolContainer}>
          <RouteScope scope={router.state.tool}>
            <RenderTool tool={router.state.tool} />
          </RouteScope>
        </div>

        {
          createMenuOpen && <ActionModal onClose={this.handleActionModalClose} actions={modalActions} />
        }

        <a className={styles.sanityStudioLogoContainer} href="http://sanity.io">
          <SanityStudioLogo />
        </a>

        {absolutes.map((Abs, i) => <Abs key={i} />)}
      </div>
    )
  }
})
