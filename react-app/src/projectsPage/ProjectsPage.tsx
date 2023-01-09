
import { useEffect, useState, useContext } from 'react'
import { ProjectComponent } from  './projectComponent'
import { Project } from '../common/Model'
import { Service, SubmitResponse } from '../service/Service'

import './projectPage.css'
import { CollectionEntity } from '../common/Siren'
import { ProjectFormComponent } from './projectFormComponent'
import { UserSession } from '../login/UserSession'

export type ProjectsPageProps = {
    service : Service
}

export type PageInfo = {
    currentPage : number,
    pageSize: number,
    collectionSize: number
}

export function ProjectsPage() {
    const [pageInfo, setPageInfo] = useState<PageInfo>({currentPage: 0, pageSize: 0, collectionSize: 0})
    const [projects , setProjects] = useState<(Project | undefined)[] | undefined>(undefined)
    const [creatingProject, setCreatingProject ] = useState<boolean>(false)
    const [response, setResponseMessage] = useState<SubmitResponse | undefined>(undefined)

    const userSession = useContext(UserSession.Context)
    
    
    useEffect(() => {
        async function loadProjects() { 
            if(!userSession) return;
            const projectsEntity: CollectionEntity<Project> = await userSession.service.getProjects(pageInfo.currentPage)
            const projects = projectsEntity?.entities?.map((entities)=>entities.properties)
            setProjects(projects)
            setPageInfo(projectsEntity.properties)
        }
        
         loadProjects()
    }, [ pageInfo.currentPage, userSession])

    const handleNextPage = () => {
        setPageInfo({
            currentPage: pageInfo.currentPage + 1,
            pageSize: pageInfo.pageSize,
            collectionSize: pageInfo.pageSize
        })

        setProjects(undefined)
    }

    const handlePreviousPage = () => {
        setPageInfo({
            currentPage: pageInfo.currentPage - 1,
            pageSize: pageInfo.pageSize,
            collectionSize: pageInfo.pageSize
        })
        
        setProjects(undefined)
    }

    const handleCreateProjectButton = () => {
        setCreatingProject((creatingProject) => !creatingProject)
    }

    const handleOnMessage = (message: SubmitResponse) =>
    {
        if(message.ok) setProjects(undefined)
        
        setResponseMessage(message)
    }

    return (
        <div className = "project-page-element">
            
            <div className="ui segment">
                <div> 
                    <button className="ui right floated primary button" onClick={handleCreateProjectButton}>Create Project</button>
                    
                    { ((pageInfo.currentPage + 1) * pageInfo.pageSize < pageInfo.collectionSize) ? <button className="ui right floated secondary button" onClick={handleNextPage}>Next Page</button> : <></>}
                    { (pageInfo.currentPage > 0) ? <button className="ui right floated secondary button" onClick={handlePreviousPage}>Previous Page</button>: <></>}
                    <h1 className="ui left header">
                        Projects
                    </h1>
                    <p></p>
                    {creatingProject ? <ProjectFormComponent onMessage={handleOnMessage}/> : <></>}
                </div>
                {response ?
                    <div className={response.ok ? "ui positive message" : "ui negative message"}>
                        <i className="close icon" onClick={() => setResponseMessage(undefined)}></i>
                        <div className="header">
                            {response.message}
                        </div>
                    </div> : <></>}
                <div className="ui segment">
                    <div className="ui items">
                        {projects ? projects.map((project , index)=><ProjectComponent project={project}  onMessage={handleOnMessage} key={index}/>): <div className="ui active centered inline loader"/>}
                    </div>
                </div>
            </div>
        </div> 
    )
}