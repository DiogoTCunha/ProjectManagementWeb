import './App.css';
import {BrowserRouter, Switch, Route, Redirect} from 'react-router-dom'
import { useState } from 'react'
import { Login } from './login/LoginPage';
import { UserSession } from './login/UserSession';
import { ProjectsPage} from './projectsPage/ProjectsPage'
import { getService } from './service/Service';
import { ProjectComponent } from './singleProjectPage/SingleProject';
import { IssuePage } from './issues/issuePage';


const URL_API = "http://localhost:3000/api"

function App() {
  const [userCredentials, setUserCredentials] = useState<UserSession.Credentials | undefined>(undefined)
  const [logoutErrorMessage, setLogoutErrorMessage] = useState<string | undefined>(undefined)
  const userSessionRepo = UserSession.createRepository()
  
  const getCredentials = ()=>{
    if(userCredentials) return userCredentials

    if(userSessionRepo.isLoggedIn()) setUserCredentials(userSessionRepo.isLoggedIn())
    
    return userCredentials
  }

  let service = getService(new URL(URL_API));

  const currentSessionContext = {
    credentials:  getCredentials(),
    service: service,
    login: (username: string, password: string) => {
      setUserCredentials(userSessionRepo.login(username, password))
    },
    logout: () => { 
      userSessionRepo.logout(); setUserCredentials(undefined)
    },
    forceLogout: (errorMessage: string) =>{
      userSessionRepo.logout(); 
      setLogoutErrorMessage(errorMessage)
      setUserCredentials(undefined)
    }
  }

  return (
    <div className="App">
      <UserSession.Context.Provider value={currentSessionContext}>
      {userSessionRepo.isLoggedIn() ? 
        <div style={{paddingLeft:"10%"}}>
          <button className = "ui mini basic icon button" onClick = { () => { currentSessionContext.logout();}}> LOGOUT <i className = "sign-out icon"/></button>
          <a className = "ui mini basic icon button"  href="/projects">HOME<i className = "home icon"/></a>
        </div> : <></>
      }
      <BrowserRouter>
        <Switch>
          <Route exact path = "/login">
            <Login.Page redirectPath = "/projects" errorMessage={logoutErrorMessage}/>
          </Route>
          
          <Route exact path = "/projects">
            <Login.EnsureCredentials loginPageRoute = "/login">
              <ProjectsPage/>
            </Login.EnsureCredentials>
          </Route>
          <Route exact path = "/projects/:projectName">
            <Login.EnsureCredentials loginPageRoute = "/login">
              <ProjectComponent></ProjectComponent>
            </Login.EnsureCredentials>
          </Route>
          <Route path = "/projects/:projectName/issues/:issueId">
            <Login.EnsureCredentials loginPageRoute = "/login">
              <IssuePage></IssuePage>
            </Login.EnsureCredentials>
          </Route>
          <Route>
            <Login.EnsureCredentials loginPageRoute = "/login">
              <Redirect to = {"/projects"} />
            </Login.EnsureCredentials>
          </Route>  
        </Switch>
      </BrowserRouter>
      </UserSession.Context.Provider> 
    </div>
  );
}

export default App;

