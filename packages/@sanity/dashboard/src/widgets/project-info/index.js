import React from 'react'
import PropTypes from 'prop-types'
import sanityClient from 'part:@sanity/base/client'
import getIt from 'get-it'
import jsonResponse from 'get-it/lib/middleware/jsonResponse'
import promise from 'get-it/lib/middleware/promise'
import AnchorButton from 'part:@sanity/components/buttons/anchor'
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

function getManageUrl(projectId) {
  return `https://manage.sanity.io/projects/${projectId}`
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
      {
        title: 'Sanity project',
        rows: [{title: 'Project ID', value: projectId}, {title: 'Dataset', value: dataset}]
      }
    ]

    // Handle any apps
    const apps = [studioHost ? {title: 'Studio', value: studioHost} : null]
      .concat(propsData.filter(item => item.category === 'apps'))
      .filter(Boolean)
    if (apps.length > 0) {
      result = result.concat([{title: 'Apps', rows: apps}])
    }

    // Handle APIs
    result = result.concat(
      [
        {
          title: 'APIs',
          rows: [
            {title: 'GROQ', value: getGroqUrl(projectId)},
            {title: 'GraphQL', value: graphqlApi || 'Not deployed'}
          ]
        }
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

    if (error) {
      return <pre>{JSON.stringify(error, null, 2)}</pre>
    }

    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Project info</h1>
        <table className={styles.table}>
          {this.assembleTableRows().map(item => {
            if (!item || !item.rows) {
              return null
            }

            return (
              <tbody key={item.title}>
                <tr>
                  <th colSpan="2" className={styles.sectionHeader}>
                    {item.title}
                  </th>
                </tr>
                {item.rows.map(row => {
                  return (
                    <tr key={row.title}>
                      <th>{row.title}</th>
                      <td>{isUrl(row.value) ? <a href={row.value}>{row.value}</a> : row.value}</td>
                    </tr>
                  )
                })}
              </tbody>
            )
          })}
        </table>
        <span className={styles.button}>
          <AnchorButton
            href={getManageUrl(sanityClient.clientConfig.projectId)}
            bleed
            color="primary"
            kind="simple"
          >
            Manage project
          </AnchorButton>
        </span>
      </div>
    )
  }
}

export default {
  name: 'project-info',
  component: ProjectInfo
}
