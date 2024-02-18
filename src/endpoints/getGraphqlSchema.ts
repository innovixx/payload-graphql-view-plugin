/* eslint-disable prettier/prettier */
import { printSchema } from 'graphql'
import type {
  ASTNode,
  DocumentNode,
  FieldDefinitionNode,
  InterfaceTypeDefinitionNode,
  NamedTypeNode,
  ObjectTypeDefinitionNode,
  TypeNode,
  UnionTypeDefinitionNode,
} from 'graphql/language'
import { parse, print as graphqlPrint, visit } from 'graphql/language'
import type { Endpoint } from 'payload/config'

import { toSingularString } from '../utils/toSingularString'

interface Arg {
  name: { value: string }
  type: {
    kind: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type?: { kind: string; name?: { value: string }; type?: any }
  }
}

const scalarTypes = ['String', 'Int', 'Float', 'Boolean', 'ID', 'DateTime', 'JSON']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fieldsMemoizationCache: any = {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const inlineFragmentsMemoizationCache: any = {};

const formatFieldArguments = (fieldArgs: Arg[]): string => {
  return fieldArgs
    .filter((arg: Arg) => arg.type.kind === 'NonNullType')
    .map((arg: Arg) => `($${arg.name.value}: ${arg.type.type?.name?.value}!)`)
    .join(', ')
}

const getFieldArguments = (fieldArgs: Arg[]): string => {
  return fieldArgs
    .filter((arg: Arg) => arg.type.kind === 'NonNullType')
    .map((arg: Arg) => `(${arg.name.value}: $${arg.name.value})`)
    .join(', ')
}

const getNamedType = (typeNode: TypeNode): NamedTypeNode | null => {
  while (typeNode.kind === 'NonNullType' || typeNode.kind === 'ListType') {
    typeNode = typeNode.type
  }
  return typeNode.kind === 'NamedType' ? typeNode : null
}

const getInlineFragments = (
  schemaAst: DocumentNode,
  typeName: string,
  currentDepth: number,
  maxDepth: number,
  visitedTypes: Set<string>
): string => {

  const cacheKey = `${typeName}-${currentDepth}`;
  if (inlineFragmentsMemoizationCache[cacheKey]) {
    return inlineFragmentsMemoizationCache[cacheKey];
  }

  const unionOrInterfaceTypeDefinition = schemaAst.definitions.find(
    (def: ASTNode):
      def is UnionTypeDefinitionNode | InterfaceTypeDefinitionNode =>
      (def.kind === 'UnionTypeDefinition' || def.kind === 'InterfaceTypeDefinition') && def.name.value === typeName
  );

  if (!unionOrInterfaceTypeDefinition) {
    throw new Error(`Union or Interface type "${typeName}" not found in schema.`);
  }

  let fragments = '';
  const possibleTypes = unionOrInterfaceTypeDefinition.kind === 'UnionTypeDefinition'
    ? unionOrInterfaceTypeDefinition.types // For Union types, get the possible types directly
    : schemaAst.definitions // For Interface types, find Object types that implement this interface
      .filter(
        (def: ASTNode):
          def is ObjectTypeDefinitionNode =>
          def.kind === 'ObjectTypeDefinition' &&
          def.interfaces !== undefined && def.interfaces.some(interfaceType => interfaceType.name.value === typeName)
      )
      .map(objType => ({ name: objType.name })); // Map to the same structure as Union types for consistency

  possibleTypes?.forEach(type => {
    const fragmentTypeName = type.name.value;
    const nestedFields = getFields(fragmentTypeName, schemaAst, currentDepth + 1, maxDepth, visitedTypes);

    if (nestedFields) {
      fragments += `
        ... on ${fragmentTypeName} {${nestedFields}
        ${' '.repeat((currentDepth + 1) * 2)}}`;
    }
  });

  inlineFragmentsMemoizationCache[cacheKey] = fragments;
  return fragments;
};

const getFields = (
  type: string,
  schemaAst: DocumentNode,
  currentDepth: number,
  maxDepth: number,
  visitedTypes: Set<string> = new Set(),
): string => {
  if (currentDepth > maxDepth || visitedTypes.has(type)) {
    return '';
  }

  const cacheKey = `${type}-${currentDepth}`;
  if (fieldsMemoizationCache[cacheKey]) {
    return fieldsMemoizationCache[cacheKey];
  }

  visitedTypes.add(type)

  const typeDefinition = schemaAst.definitions.find(
    (def: ASTNode): def is ObjectTypeDefinitionNode =>
      def.kind === 'ObjectTypeDefinition' && def.name.value === type,
  )

  if (!typeDefinition) {
    return ''
  }

  let fields = ''
  typeDefinition.fields?.forEach((field: FieldDefinitionNode) => {
    const namedType = getNamedType(field.type)

    if (namedType?.name) {
      const fieldName = namedType.name.value
      fields += `\n  ${' '.repeat(currentDepth * 2)}${field.name.value}`

      if (scalarTypes.includes(fieldName)) {
        // Skip, as it is a scalar type
      } else {
        // Check if the type is a union or interface
        const unionOrInterfaceDefinition = schemaAst.definitions.find(
          def =>
            (def.kind === 'UnionTypeDefinition' || def.kind === 'InterfaceTypeDefinition') &&
            def.name.value === fieldName,
        )

        if (unionOrInterfaceDefinition) {
          // If it is a union or interface type, we handle it separately
          fields += ` {${getInlineFragments(
            schemaAst,
            fieldName,
            currentDepth,
            maxDepth,
            visitedTypes,
          )}\n  ${' '.repeat(currentDepth * 2)}}`
        } else {
          // Else, handle it as a regular type
          const nestedFields = getFields(
            fieldName,
            schemaAst,
            currentDepth + 1,
            maxDepth,
            visitedTypes,
          )
          if (nestedFields) {
            fields += ` {${nestedFields}\n  ${' '.repeat(currentDepth * 2)}}`
          }
        }
      }
    }
  })

  return fields
}

const generatePrefilledQuery = (
  schema: string,
  queryType: string,
  depth: number,
): string => {

  const schemaAst = parse(schema)
  let queryFields = ''
  let queryArgsStr = ''
  let queryArgs = ''

  visit(schemaAst, {
    ObjectTypeDefinition(node: ObjectTypeDefinitionNode) {
      if (node.name.value === 'Query') {
        node.fields?.forEach(field => {
          if (field.name.value === queryType) {
            queryArgsStr = field.arguments?.some(arg => arg.type.kind === 'NonNullType')
              ? formatFieldArguments(field.arguments as unknown as Arg[])
              : ''
            queryArgs = field.arguments?.some(arg => arg.type.kind === 'NonNullType')
              ? getFieldArguments(field.arguments as unknown as Arg[])
              : ''
            queryFields = getFields(queryType, schemaAst, 0, depth)
          }
        })
      }
    },
  })

  if (!queryFields) {
    return ''
  }

  const query = `
    query ${queryType}${queryArgsStr} {
      ${queryType}${queryArgs} {${queryFields}
      }
    }
  `
  const cleanedQuery = query.replace(/(\{\s*\})/g, '');

  return graphqlPrint(parse(cleanedQuery))
}

export const getGraphqlQuery = (): Endpoint => ({
  path: '/getGraphqlQuery',
  method: 'get',
  handler: async (req, res) => {
    const slug = req.query.slug as string
    const depth = req.query.depth as string

    const prefilledQuery = generatePrefilledQuery(
      printSchema(req.payload.schema),
      toSingularString(slug)
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(''),
      depth ? parseInt(depth, 10) : 2,
    )

    return res.status(200).json(prefilledQuery)
  },
})
