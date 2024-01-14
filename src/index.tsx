import React from 'react'
import deepmerge from 'deepmerge'
import path from 'path'
import type { Config, Plugin } from 'payload/config'

import { GraphqlViewComponent } from './components'
import { getGraphqlQuery } from './endpoints/getGraphqlSchema'
import type { PluginConfig } from './types'

export default (pluginConfig: PluginConfig): Plugin =>
  config => {
    const updatedConfig: Config = {
      ...config,
      // @ts-expect-error view prop type mismatch, but it works
      collections:
        config.collections?.map(collection => {
          const isEnabled =
            pluginConfig?.collections?.includes(collection.slug) || !pluginConfig?.collections

          if (isEnabled) {
            return {
              ...collection,
              admin: {
                ...collection.admin,
                components: {
                  ...collection.admin?.components,
                  views: {
                    Edit: {
                      ...collection.admin?.components?.views?.Edit,
                      Graphql: {
                        path: '/graphql',
                        Tab: {
                          href: '/graphql',
                          label: 'GraphQL',
                        },
                        Component: ({ user }) => (
                          <GraphqlViewComponent
                            user={user}
                            initialEndpoint={
                              pluginConfig.graphqlUrl
                                ? pluginConfig.graphqlUrl
                                : `${config.serverURL}/api/${config.routes?.graphQL || 'graphql'}`
                            }
                            type="collection"
                            collection={config.collections?.find(c => c.slug === collection.slug)}
                            maxDepth={pluginConfig.maxDepth}
                          />
                        ),
                      },
                    },
                  },
                },
              },
            }
          }

          return collection
        }) || [],
      // @ts-expect-error view prop type mismatch, but it works
      globals:
        config.globals?.map(global => {
          const isEnabled = pluginConfig?.globals?.includes(global.slug) || !pluginConfig?.globals

          if (isEnabled) {
            return {
              ...global,
              admin: {
                ...global.admin,
                components: {
                  ...global.admin?.components,
                  views: {
                    Edit: {
                      ...global.admin?.components?.views?.Edit,
                      Graphql: {
                        path: '/graphql',
                        Tab: {
                          href: '/graphql',
                          label: 'GraphQL',
                        },
                        Component: ({ user }) => (
                          <GraphqlViewComponent
                            user={user}
                            initialEndpoint={
                              pluginConfig.graphqlUrl
                                ? pluginConfig.graphqlUrl
                                : `${config.serverURL}/api/${config.routes?.graphQL || 'graphql'}`
                            }
                            type="global"
                            global={config.globals?.find(g => g.slug === global.slug)}
                          />
                        ),
                      },
                    },
                  },
                },
              },
            }
          }

          return global
        }) || [],
      endpoints: [...(config.endpoints || []), getGraphqlQuery(pluginConfig?.graphqlSchema)],
      admin: {
        ...config.admin,
        webpack: webpackConfig => {
          const newConfig = {
            ...webpackConfig,
            resolve: {
              ...webpackConfig.resolve,
              alias: {
                ...webpackConfig.resolve.alias,
                fs: path.resolve(__dirname, './utils/emptyModule.js'),
              },
            },
          }
          return newConfig
        },
      },
    }

    return updatedConfig
  }
