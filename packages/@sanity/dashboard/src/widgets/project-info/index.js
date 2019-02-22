import React from 'react'
import PropTypes from 'prop-types'
import sanityClient from 'part:@sanity/base/client'
import getIt from 'get-it'
import jsonResponse from 'get-it/lib/middleware/jsonResponse'
import promise from 'get-it/lib/middleware/promise'
import styles from './ProjectInfo.css'

const request = getIt([promise(), jsonResponse()])

function isUrl(url) {
  return /^https?:\/\//.test(`${url}`)
}

function getGraphQlUrl(projectId) {
  return `https://${projectId}.api.sanity.io/v1/graphql/test`
}

function getGroqUrl(projectId) {
  return `https://${projectId}.api.sanity.io/v1/groq/test`
}

class ProjectInfo extends React.Component {
  static propTypes = {
    data: PropTypes.array
  }
  static defaultProps = {
    data: []
  }

  state = {
    studioHost: null,
    graphqlApi: null,
    error: null
  }

  componentDidMount() {
    const {projectId} = sanityClient.clientConfig
    // fetch project data
    sanityClient.projects
      .getById(projectId)
      .then(result => {
        const {studioHost} = result
        this.setState({studioHost: studioHost ? `https://${studioHost}.sanity.studio` : null})
      })
      .catch(error => this.setState({error}))

    // ping assumed graphql endpoint
    const graphqlApi = getGraphQlUrl(projectId)
    request({url: graphqlApi})
      .then(response => {
        this.setState({graphqlApi: response.statusCode === 200 ? graphqlApi : null})
      })
      .catch(error => this.setState({error}))
  }

  assembleTableRows() {
    const {projectId, dataset} = sanityClient.clientConfig
    const {graphqlApi, studioHost} = this.state
    const propsData = this.props.data

    let result = [
      {title: 'Sanity project'},
      {title: 'Project ID', value: projectId},
      {title: 'Dataset', value: dataset}
    ]

    // Handle any apps
    const apps = [studioHost ? {title: 'Studio', value: studioHost} : null]
      .concat(propsData.filter(item => item.category === 'apps'))
      .filter(Boolean)
    if (apps.length > 0) {
      result = result.concat([{title: 'Apps'}], apps)
    }

    // Handle APIs
    result = result.concat(
      [
        {title: 'APIs'},
        {title: 'GROQ', value: getGroqUrl(projectId)},
        {title: 'GraphQL', value: graphqlApi || 'Not deployed'}
      ],
      propsData.filter(item => item.category === 'apis')
    )

    // Handle whatever else there might be
    const otherStuff = {}
    propsData.forEach(item => {
      if (item.category !== 'apps' && item.category !== 'apis') {
        if (!otherStuff[item.category]) {
          otherStuff[item.category] = []
        }
        otherStuff[item.category].push(item)
      }
    })

    Object.keys(otherStuff).forEach(category => {
      result.push({title: category})
      result = result.concat(otherStuff[category])
    })

    return result
  }

  render() {
    const {error} = this.state
    const tableRows = this.assembleTableRows()
    const manageUrl = `https://manage.sanity.io/projects/${sanityClient.clientConfig.projectId}`

    if (error) {
      return <pre>{JSON.stringify(error, null, 2)}</pre>
    }

    return (
      <div className={styles.container}>
        <h2>ProjectInfo</h2>
        <table>
          <tbody>
            {tableRows.map(item => {
              if (item.value) {
                return (
                  <tr key={item.title}>
                    <th>{item.title}</th>
                    <td>
                      {isUrl(item.value) ? <a href={item.value}>{item.value}</a> : item.value}
                    </td>
                  </tr>
                )
              }
              return (
                <tr key={item.title}>
                  <th colSpan="2">{item.title}</th>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div>
          <a href={manageUrl}>Manage project</a>
        </div>
      </div>
    )
  }
}

export default {
  name: 'project-info',
  component: ProjectInfo
}
