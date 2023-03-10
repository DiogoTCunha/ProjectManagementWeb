import { useContext, useRef, useState, ReactNode } from 'react'
import { Redirect } from 'react-router'
import { UserSession } from './UserSession'


export namespace Login {
  type PageProps = {
    redirectPath: string
    errorMessage?: string
  }
  /**
   * The application's login page.
   * @argument props - the page's props object.
   * @returns The React Element used to render the page.
   */
  
  export function Page({ redirectPath, errorMessage }: PageProps) {
    
    const userNameInputRef = useRef<HTMLInputElement>(null)
    const pwdInputRef = useRef<HTMLInputElement>(null)
    const userSession = useContext(UserSession.Context)

    type CredentialsState = { usernameOK: boolean, passwordOK: boolean }

    const [credentialsState, setCredentialsState] = useState<CredentialsState | undefined>()


    function credentialsAreOK() { 
      return credentialsState?.usernameOK && credentialsState?.passwordOK 
    }
  
    function handleSubmit() {
      const username = userNameInputRef.current?.value
      const password = pwdInputRef.current?.value
      
      const enteredCredentials: CredentialsState = { 
        usernameOK: username !== undefined && username.length!==0 && username.match(/\s/) == null,
        passwordOK: password !== undefined && password.length!==0
      }
  
      if (!enteredCredentials.usernameOK) { userNameInputRef.current?.focus() }
      else if (!enteredCredentials.passwordOK) { pwdInputRef.current?.focus() }

      if (username && password && userSession)
      userSession.login(username, password)
  
      setCredentialsState(enteredCredentials)
    }
  
    return userSession?.credentials || credentialsAreOK() ? <Redirect to={redirectPath} /> : (
      <div className="ui middle aligned center aligned grid" style={{ marginTop: 125 }}>
       
        <div className="column" style={{maxWidth: 380}}>
          
          <h2 className="ui header centered">
            <div className="content">DAW</div>
          </h2>
          {errorMessage ? <div className= "ui negative message">{errorMessage}</div> : <></>}
          <form className={`ui large form ${credentialsState && !credentialsAreOK() ? ' error' : ''}`}>
            <div className="ui segment">
              <div className={`field ${credentialsState && !credentialsState.usernameOK ? 'error' : ''}`}>
                <div className="ui input left icon">
                  <i className="user icon"></i>
                  <input type="text" name="username" placeholder="Your username" ref={userNameInputRef} />
                </div>
              </div>
              <div className={`field ${credentialsState && !credentialsState.passwordOK ? 'error' : ''}`}>
                <div className="ui input left icon">
                  <i className="key icon"></i>
                  <input type="password" name="password" placeholder="Your password" ref={pwdInputRef} />
                </div>
              </div>
              <button className="ui fluid large submit button" type="button" onClick={handleSubmit} >
                <i className="sign in icon"></i>Sign in
              </button>
            </div>
            <div className="ui error message">
              <p>Enter a username with no whitespace characters and a non empty password</p>
            </div>
            
          </form>
        </div>
      </div>
    )
    
  }

  type EnsureCredentialsProps = {
    loginPageRoute: string,
    children?: ReactNode
  }
  

  /**
 * Component responsible for verifying if the user has already entered his credentials.
 */
  export function EnsureCredentials({loginPageRoute, children} : EnsureCredentialsProps) {
    return <UserSession.Context.Consumer>
      { user => user && user.credentials ? <> {children} </> : <Redirect to={loginPageRoute} /> }
    </UserSession.Context.Consumer>
  }

}


