/* eslint-disable react/forbid-prop-types, no-console */
import React from 'react'
import {isPlainObject} from 'lodash'
import PropTypes from 'prop-types'
import {Box, Card, Stack, Heading, Grid, Label, Text, Code, Button} from '@sanity/ui'
import {versionedClient} from '../../versionedClient'
import {DashboardWidget} from '../../DashboardTool'
import {WidgetContainer} from '../../legacyParts'

const {projectId, dataset} = versionedClient.config()

function isUrl(url) {
  return /^https?:\/\//.test(`${url}`)
}

function getGraphQlUrl() {
  return `https://${projectId}.api.sanity.io/v1/graphql/${dataset}/default`
}

function getGroqUrl() {
  return `https://${projectId}.api.sanity.io/v1/groq/${dataset}`
}

function getManageUrl() {
  return `https://manage.sanity.io/projects/${projectId}`
}

class ProjectInfo extends React.PureComponent {
  static propTypes = {
    // eslint-disable-next-line camelcase
    __experimental_before: PropTypes.array,
    data: PropTypes.array,
  }
  static defaultProps = {
    // eslint-disable-next-line camelcase
    __experimental_before: [],
    data: [],
  }

  state = {
    studioHost: null,
    graphqlApi: null,
  }

  componentDidMount() {
    // fetch project data
    this.subscriptions = []

    this.subscriptions.push(
      versionedClient.observable.request({uri: `/projects/${projectId}`}).subscribe({
        next: (result) => {
          const {studioHost} = result
          this.setState({studioHost: studioHost ? `https://${studioHost}.sanity.studio` : null})
        },
        error: (error) => {
          console.log('Error while looking for studioHost', error)
          this.setState({
            studioHost: {
              error: 'Something went wrong while looking up studioHost. See console.',
            },
          })
        },
      })
    )

    // ping assumed graphql endpoint
    this.subscriptions.push(
      versionedClient.observable
        .request({
          method: 'HEAD',
          uri: `/graphql/${dataset}/default`,
        })
        .subscribe({
          next: () => this.setState({graphqlApi: getGraphQlUrl()}),
          error: (error) => {
            if (error.statusCode === 404) {
              this.setState({graphqlApi: null})
            } else {
              console.log('Error while looking for graphqlApi', error)
              this.setState({
                graphqlApi: {
                  error: 'Something went wrong while looking up graphqlApi. See console.',
                },
              })
            }
          },
        })
    )
  }

  componentWillUnmount() {
    this.subscriptions.forEach((sub) => sub.unsubscribe())
  }

  assembleTableRows() {
    const {graphqlApi, studioHost} = this.state
    const propsData = this.props.data

    let result = [
      {
        title: 'Sanity project',
        rows: [
          {title: 'Project ID', value: projectId},
          {title: 'Dataset', value: dataset},
        ],
      },
    ]

    // Handle any apps
    const apps = [studioHost ? {title: 'Studio', value: studioHost} : null]
      .concat(propsData.filter((item) => item.category === 'apps'))
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
            {title: 'GROQ', value: getGroqUrl()},
            {title: 'GraphQL', value: graphqlApi || 'Not deployed'},
          ],
        },
      ],
      propsData.filter((item) => item.category === 'apis')
    )

    // Handle whatever else there might be
    const otherStuff = {}
    propsData.forEach((item) => {
      if (item.category !== 'apps' && item.category !== 'apis') {
        if (!otherStuff[item.category]) {
          otherStuff[item.category] = []
        }
        otherStuff[item.category].push(item)
      }
    })
    Object.keys(otherStuff).forEach((category) => {
      result.push({title: category, rows: otherStuff[category]})
    })

    return result
  }

  render() {
    return (
      <>
        {this.props.__experimental_before &&
          this.props.__experimental_before.map((widgetConfig, idx) => (
            <WidgetContainer key={String(idx)} config={widgetConfig} />
          ))}
        <Box height="fill" marginTop={this.props.__experimental_before?.length > 0 ? 4 : 0}>
          <DashboardWidget
            footer={
              <Button
                style={{width: '100%'}}
                paddingX={2}
                paddingY={4}
                mode="bleed"
                tone="primary"
                text="Manage project"
                as="a"
                href={getManageUrl()}
              />
            }
          >
            <Card
              paddingY={4}
              radius={2}
              role="table"
              aria-label="Project info"
              aria-describedby="project_info_table"
            >
              <Stack space={4}>
                <Box paddingX={3} as="header">
                  <Heading size={1} as="h2" id="project_info_table">
                    Project info
                  </Heading>
                </Box>
                {this.assembleTableRows().map((item) => {
                  if (!item || !item.rows) {
                    return null
                  }

                  return (
                    <Stack key={item.title} space={3}>
                      <Card borderBottom padding={3}>
                        <Label size={0} muted role="columnheader">
                          {item.title}
                        </Label>
                      </Card>
                      <Stack space={4} paddingX={3} role="rowgroup">
                        {item.rows.map((row) => {
                          return (
                            <Grid key={row.title} columns={2} role="row">
                              <Text weight="medium" role="rowheader">
                                {row.title}
                              </Text>
                              {isPlainObject(row.value) && <Text size={1}>{row.value.error}</Text>}
                              {!isPlainObject(row.value) && (
                                <>
                                  {isUrl(row.value) ? (
                                    <Text size={1} role="cell" style={{wordBreak: 'break-word'}}>
                                      <a href={row.value}>{row.value}</a>
                                    </Text>
                                  ) : (
                                    <Code size={1} role="cell" style={{wordBreak: 'break-word'}}>
                                      {row.value}
                                    </Code>
                                  )}
                                </>
                              )}
                            </Grid>
                          )
                        })}
                      </Stack>
                    </Stack>
                  )
                })}
              </Stack>
            </Card>
          </DashboardWidget>
        </Box>
      </>
    )
  }
}

export default ProjectInfo
