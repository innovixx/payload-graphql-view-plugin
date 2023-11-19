import { type GraphQLFieldMap } from 'graphql'
import type { Endpoint } from 'payload/config'
import type { Collection } from 'payload/dist/exports/types'

const generateGraphQLFields = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: GraphQLFieldMap<any, any> | undefined | any,
  maxDepth = Infinity,
  depth = 0,
): string => {
  let fields = ''
  for (const key in obj) {
    const field = obj[key]

    if (field?.type?._fields) {
      if (depth <= maxDepth) {
        fields += `\n${'  '.repeat(depth + 2)}${field.name} {${generateGraphQLFields(
          field.type?._fields,
          maxDepth,
          depth + 1,
        )}\n${'  '.repeat(depth + 2)}}`
      } else {
        if (field.type?._fields?.id) {
          fields += `\n${'  '.repeat(depth + 2)}${field.name} {id}`
        }
      }
    } else if (field?.name && !field?.type?.ofType) {
      fields += `\n${'  '.repeat(depth + 2)}${field.name}`
    } else if (field?.name && field?.type?.ofType.name) {
      fields += `\n${'  '.repeat(depth + 2)}${field.name}`
    }
  }
  return fields
}

const getCollectionQuery = (graphQL: Collection['graphQL'], depth: number): string => {
  const typeName = graphQL?.type?.name
  const fields = graphQL?.type?.getFields()

  return `
query ${typeName}($documentId: String!, $draft: Boolean, $fallbackLocale: FallbackLocaleInputType, $locale: LocaleInputType) {
  ${typeName} (id: $documentId, draft: $draft, fallbackLocale: $fallbackLocale, locale: $locale) {${generateGraphQLFields(
    fields,
    depth,
  )}
  }
}`
}

const getGlobalQuery = (graphqlObject: Collection['graphQL'], depth: number): string => {
  if (typeof graphqlObject !== 'object') return ''

  const typeName = graphqlObject?.type?.name
  const fields = graphqlObject?.type?.getFields()

  return `
query ${typeName} {
  ${typeName} {${generateGraphQLFields(fields, depth)}
  }
}`
}

export const getGraphqlQuery: Endpoint = {
  path: '/getGraphqlQuery',
  method: 'get',

  handler: async (req, res) => {
    const slug = req.query.slug as string
    const type = req.query.type as string
    const depth = req.query.depth as string

    if (type === 'collection') {
      const graphqlObject = req.payload.collections[slug]?.graphQL

      if (!graphqlObject) return res.status(404).send('Collection not found')
      const whereQuery = getCollectionQuery(graphqlObject, depth ? parseInt(depth, 10) : 1)
      return res.status(200).json(whereQuery)
    }

    if (type === 'global') {
      let updatedSlug = slug.charAt(0).toUpperCase() + slug.slice(1)
      updatedSlug = updatedSlug.replace(/-/g, '')
      updatedSlug = updatedSlug.replace(/s$/, '')

      const graphqlObjects = req.payload.globals.graphQL
      if (!graphqlObjects) return res.status(404).send('Global not found')
      const graphqlObject = Object.values(graphqlObjects).find(obj => obj.type.name === updatedSlug)
      if (!graphqlObject) return res.status(404).send('Global not found')
      const whereQuery = getGlobalQuery(
        graphqlObject as Collection['graphQL'],
        depth ? parseInt(depth, 10) : 1,
      )
      return res.status(200).json(whereQuery)
    }

    return res.status(404).send('GraphQL object not found')
  },
}
