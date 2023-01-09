import { useContext , useState } from 'react'
import { Project } from '../common/Model'
import { UserSession } from '../login/UserSession'
import { SubmitResponse } from '../service/Service'


export interface ProjectProps{
    project? : Project
    onMessage : (message : SubmitResponse) => void
}


export function ProjectComponent({project, onMessage}: ProjectProps) {
    let link = `./projects/${project?.name}`
    const userSession = useContext(UserSession.Context)
    const [response, setResponseMessage] = useState<SubmitResponse | undefined>(undefined)


    const handleDeleteProject = async () =>{
        if(!userSession || !project || !userSession.credentials) return;

        const resp = await userSession.service.deleteProject(project.name, userSession.credentials)

        if (resp.statusCode == 401) userSession.forceLogout("Invalid Credentials")

        onMessage(resp)
    }
    return(
        <div className="item"> 
            <div className="middle aligned content">   
                <div className="header"><a href={link}>{project?.name}</a></div>
                <button className="ui red button" style = {{float: "right"}} onClick={handleDeleteProject}>Delete Project</button>
                <div>Description:{project?.description}</div>
                <div>Owner : {project?.projectOwner}</div>
                <div className ="ui divider"></div>
            </div>        
        </div>      
        
    )
}
