/* eslint-disable no-console */
import React from 'react'
import {isPlainObject} from 'lodash'
import PropTypes from 'prop-types'
import sanityClient from 'part:@sanity/base/client'
import AnchorButton from 'part:@sanity/components/buttons/anchor'
import styles from './ProjectInfo.css'

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
    const {projectId} = sanityClient.config()
    // fetch project data
    sanityClient.projects
      .getById(projectId)
      .then(result => {
        const {studioHost} = result
        this.setState({studioHost: studioHost ? `https://${studioHost}.sanity.studio` : null})
      })
      .catch(error => {
        console.log('Error while looking for studioHost', error)
        this.setState({
          studioHost: {
            error: 'Something went wrong while looking up studioHost. See console.'
          }
        })
      })

    // ping assumed graphql endpoint
    sanityClient
      .request({
        method: 'HEAD',
        uri: `/graphql/${sanityClient.config().dataset}/default`
      })
      .then(response => {
        this.setState({graphqlApi: getGraphQlUrl(projectId)})
      })
      .catch(error => {
        if (error.statusCode === 404) {
          this.setState({graphqlApi: null})
        } else {
          console.log('Error while looking for graphqlApi', error)
          this.setState({
            graphqlApi: {
              error: 'Something went wrong while looking up graphqlApi. See console.'
            }
          })
        }
      })
  }

  assembleTableRows() {
    const {projectId, dataset} = sanityClient.config()
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
        <header className={styles.header}>
          <h2 className={styles.title}>Project info</h2>
        </header>
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
                      {isPlainObject(row.value) && (
                        <td className={styles.apiError}>{row.value.error}</td>
                      )}
                      {!isPlainObject(row.value) && (
                        <td>
                          {isUrl(row.value) ? <a href={row.value}>{row.value}</a> : row.value}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            )
          })}
        </table>
        <div className={styles.buttonContainer}>
          <AnchorButton
            href={getManageUrl(sanityClient.clientConfig.projectId)}
            bleed
            color="primary"
            kind="simple"
          >
            Manage project
          </AnchorButton>
        </div>
      </div>
    )
  }
}

export default ProjectInfo
