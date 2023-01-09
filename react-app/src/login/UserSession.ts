import { createContext } from 'react'
import { Service } from '../service/Service'

class Base64Encoded {
  readonly value: string
  constructor(value: string) {this.value = btoa(value)}
}



export namespace UserSession{
    /**
     * The contract to be supported by user session repositories.
     */
    export interface Repository {
      isLoggedIn: () => Credentials | undefined,
      login: (username: string, password: string) => Credentials
      logout: () => void
    }

  


    /**
    * Creates a user session repository.
    * @returns The newly created user session repository.
    */
  export function createRepository(): Repository {
      const KEY = 'CredentialsKey'

    return {
      isLoggedIn: (): Credentials => { 
        const credentialsJSON = sessionStorage.getItem(KEY)
        return credentialsJSON ? JSON.parse(credentialsJSON) : undefined
      },
      login: (username: string, password: string) : Credentials => { 
        const credentials: Credentials = { username : username , type: 'Basic', content: new Base64Encoded(`${username}:${password}`) }
        sessionStorage.setItem(KEY, JSON.stringify(credentials))
        return credentials
      },
      logout: (): Repository => { 
        sessionStorage.removeItem(KEY) 
        return createRepository()
      }
    }
  }

  /**
    * The user's credentials.
  */
  export type Credentials = {
    username : string
    type: 'Basic' | 'Bearer',
    content: Base64Encoded
  }

  export type ContextType = {
    readonly credentials?: Credentials,
    service: Service,
    login: (username: string, password: string) => void,
    logout: () => void,
    forceLogout: (errorMessage: string) => void
  }

  /**
   * The user session context. Initially, it is undefined.
   */
  export const Context = createContext<ContextType | undefined>(undefined)
}
