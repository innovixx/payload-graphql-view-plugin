import React from 'react'
import type { Config, Plugin } from 'payload/config'

import { GraphqlViewComponent } from './components'
import type { PluginConfig } from './types'

export default (pluginConfig: PluginConfig): Plugin =>
  config => {
    const updatedConfig: Config = {
      ...config,
      // @ts-expect-error view prop type mismatch, but it works
      collections: config.collections?.map(collection => {
        const isEnabled = pluginConfig?.collections?.includes(collection.slug)

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
      }),
      // @ts-expect-error view prop type mismatch, but it works
      globals: config.globals?.map(global => {
        const isEnabled = pluginConfig?.globals?.includes(global.slug)

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
      }),
    }

    return updatedConfig
  }
