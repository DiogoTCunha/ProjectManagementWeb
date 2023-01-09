
export type MediaType = 'application/vnd.siren+json' | 'application/json'
export type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'TRACE'

/**
 * Type that describes links as they are represented in Siren.
 */
 export type Link = {
  rel: string[],
  href: string,
  title?: string,
  type?: MediaType
}

/**
 * Class whose instances represent actions that are included in a Siren entity.
 */
 export type Field = {
  name: string,
  type?: string,
  value?: string,
  title?: string
}

/**
 * Describes actions that are included in a Siren entity.
 */
 export type Action = {
  name: string,
  href: string,
  title?: string,
  class?: string[],
  method?: HttpMethod,
  type?: MediaType,
  fields?: Field[]
}


export type SubEntity<T> = {
  rel: string[],
  class: string[]
  properties: T,
  links: Link[],
  title: String
}

/**
 * Describes Siren entities.
 */
export type Entity<T> = {
  class: string[],
  properties: T,
  links: Link[],
  actions?: Action[],
  title?: string
}

export type Collection = {
  currentPage: number,
  pageSize: number,
  collectionSize: number
}

export type CollectionEntity<T> = {
  class: string[],
  properties: Collection,
  entities: SubEntity<T>[],
  links: Link[],
  actions: Action[],
  title: string
}