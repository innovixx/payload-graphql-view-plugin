import type { Endpoint } from 'payload/config'
import type { Collection } from 'payload/dist/exports/types'

const getCollectionQuery = (graphQL: Collection['graphQL']): string => {
  const typeName = graphQL?.type?.name
  const fields = Object.keys(graphQL?.type?.getFields() || {}).join('\n')

  return `
query ${typeName}($documentId: String!, $draft: Boolean, $fallbackLocale: FallbackLocaleInputType, $locale: LocaleInputType) {
  ${typeName} (id: $documentId, draft: $draft, fallbackLocale: $fallbackLocale, locale: $locale) {
    ${fields}
  }
}`
}

const getGlobalQuery = (graphqlObject: any): string => {
  const typeName = graphqlObject?.type?.name
  const fields = Object.keys(graphqlObject?.type?.getFields() || {}).join('\n')

  return `
query ${typeName} {
  ${typeName} {
    ${fields}
  }
}`
}

export const getGraphqlQuery: Endpoint = {
  path: '/getGraphqlQuery',
  method: 'get',

  handler: async (req, res) => {
    const slug = req.query.slug as string
    const type = req.query.type as string

    if (type === 'collection') {
      const graphqlObject = req.payload.collections[slug]?.graphQL
      if (!graphqlObject) return res.status(404).send('Collection not found')
      const whereQuery = getCollectionQuery(graphqlObject)
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
      const whereQuery = getGlobalQuery(graphqlObject)
      return res.status(200).json(whereQuery)
    }

    return res.status(404).send('GraphQL object not found')
  },
}
