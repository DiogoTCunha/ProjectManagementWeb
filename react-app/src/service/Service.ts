import * as Siren from '../common/Siren'
import * as DTO from '../common/Model'
import { UserSession } from '../login/UserSession'
import { ProjectSubmission } from '../common/SubmissionModels'


export type SubmitResponse = {
    ok: boolean
    message: string
    statusCode: number
}

export function getService(url: URL): Service {
    return {
        fetchEntity: async<T>(links: Siren.Link[], rel: string) => {
            let link = links?.filter(linkObj => linkObj.rel.includes(rel))[0].href
            const response = await fetch(`${url}/${link}`.replaceAll("+", " "))
            if (response.ok) {
                const resp = response.json()
                return resp
            }
            throw Error()
        },

        getProjects: async (page) => {
            const response = await fetch(`${url}/projects?page=${page}&limit=3`)
            console.log(`${url}/projects?page=${page}&limit=5`)
            if (response.ok) {
                const resp = response.json()
                return resp
            }
            throw Error()
        },

        getComments: async (projectName, issueId, page) => {
            if (projectName === undefined || issueId === undefined)
                throw Error()
            const response = await fetch(`${url}/projects/${projectName}/issues/${issueId}/comments?page=${page}&limit=10`)
            if (response.ok) {
                const resp = response.json()
                return resp
            }
            throw Error()
        },

        getProject: async (projectName) => {
            const response = await fetch(`${url}/projects/${projectName}`)
            if (response.ok) {
                const resp = response.json()
                return resp
            }

            return undefined
        },

        getIssue: async (projectName, issueId) => {
            const response = await fetch(`${url}/projects/${projectName}/issues/${issueId}`)

            if (response.ok) {
                const resp = response.json()
                console.log(resp)
                return resp
            }

            if (response.ok) return { ok: response.ok, statusCode: response.status }

            else {
                if (response.headers.get("Content-Type") == "application/problem+json") {
                    const resp = await response.json()
                    return { ok: response.ok, message: resp.detail, statusCode: response.status }
                }

                return { ok: response.ok, message: "An Error as Occurred", statusCode: response.status }
            }
        },

        addComment: async (projectName, issueId, text, credentials) => {
            if (credentials === undefined)
                throw Error()

            console.log(`Auth: ${credentials.type} ${credentials.content.value}`)
            const response = await fetch(`${url}/projects/${projectName}/issues/${issueId}/comments`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `${credentials.type} ${credentials.content.value}`,
                        'Content-Type': "application/json"
                    },
                    body: JSON.stringify({ text: text })
                })

            if (response.ok) return { ok: response.ok, message: `Comment created`, statusCode: response.status }

            else {
                if (response.headers.get("Content-Type") == "application/problem+json") {
                    const resp = await response.json()
                    return { ok: response.ok, message: resp.detail, statusCode: response.status }
                }

                return { ok: response.ok, message: "An Error as Occurred", statusCode: response.status }
            }
        },

        createProject: async (project, credentials) => {
            console.log(`Auth: ${credentials.type} ${credentials.content.value}`)
            const response = await fetch(`${url}/projects/`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `${credentials.type} ${credentials.content.value}`,
                        'Content-Type': "application/json"
                    },
                    body: JSON.stringify(project)
                })

            if (response.ok) return { ok: response.ok, message: `Project ${project.name} created`, statusCode: response.status }

            else {
                if (response.headers.get("Content-Type") == "application/problem+json") {
                    const resp = await response.json()
                    return { ok: response.ok, message: resp.detail, statusCode: response.status }
                }

                return { ok: response.ok, message: "An Error as Occurred", statusCode: response.status }
            }
        },

        createIssue: async (projectName: string, issue: IssueInputModel, credentials: UserSession.Credentials | undefined) => {
            const response = await fetch(`${url}/projects/${projectName}/issues`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `${credentials?.type} ${credentials?.content.value}`,
                        'Content-Type': "application/json"
                    },
                    body: JSON.stringify(issue)
                })

            if (response.ok) return { ok: response.ok, message: `Issue ${issue.name} created.`, statusCode: response.status }

            else {
                if (response.headers.get("Content-Type") == "application/problem+json") {
                    const resp = await response.json()
                    return { ok: response.ok, message: resp.detail, statusCode: response.status }
                }

                return { ok: response.ok, message: "An Error as Occurred", statusCode: response.status }
            }
        },


        addLabel: async (projectName, issueId, label, credentials) => {

            const response = await fetch(`${url}/projects/${projectName}/issues/${issueId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `${credentials?.type} ${credentials?.content.value}`,
                        'Content-Type': "application/json"
                    },
                    body: JSON.stringify([{ op: 'add', path: 'label', value: label }])
                })

            if (response.ok) return { ok: response.ok, message: `Label ${label} added`, statusCode: response.status }

            else {
                if (response.headers.get("Content-Type") == "application/problem+json") {
                    const resp = await response.json()
                    return { ok: response.ok, message: resp.detail, statusCode: response.status }
                }

                return { ok: response.ok, message: "An Error as Occurred", statusCode: response.status }
            }
        },

        removeLabel: async (projectName, issueId, label, credentials) => {
            const response = await fetch(`${url}/projects/${projectName}/issues/${issueId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `${credentials?.type} ${credentials?.content.value}`,
                        'Content-Type': "application/json"
                    },
                    body: JSON.stringify([{ op: 'remove', path: 'label', value: label }])
                })

            if (response.ok) return { ok: response.ok, message: `Label ${label} removed`, statusCode: response.status }

            else {
                if (response.headers.get("Content-Type") == "application/problem+json") {
                    const resp = await response.json()
                    return { ok: response.ok, message: resp.detail, statusCode: response.status }
                }

                return { ok: response.ok, message: "An Error as Occurred", statusCode: response.status }
            }
        },

        addAllowedLabel: async (projectName, label, credentials) => {
            const response = await fetch(`${url}/projects/${projectName}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `${credentials?.type} ${credentials?.content.value}`,
                        'Content-Type': "application/json"
                    },
                    body: JSON.stringify([{ op: 'add', path: 'label', value: label }])
                })

            if (response.ok) return { ok: response.ok, message: `Allowed Label ${label} added`, statusCode: response.status }

            else {
                if (response.headers.get("Content-Type") == "application/problem+json") {
                    const resp = await response.json()
                    return { ok: response.ok, message: resp.detail, statusCode: response.status }
                }

                return { ok: response.ok, message: "An Error as Occurred", statusCode: response.status }
            }
        },

        removeAllowedLabel: async (projectName: string, label: string, credentials: UserSession.Credentials | undefined) => {
            const response = await fetch(`${url}/projects/${projectName}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `${credentials?.type} ${credentials?.content.value}`,
                    'Content-Type': "application/json"
                },
                body: JSON.stringify([{ op: 'remove', path: 'label', value: label }])
            })

            if (response.ok) return { ok: response.ok, message: `Allowed Label ${label} added`, statusCode: response.status }

            else {
                if (response.headers.get("Content-Type") == "application/problem+json") {
                    const resp = await response.json()
                    return { ok: response.ok, message: resp.detail, statusCode: response.status }
                }

                return { ok: response.ok, message: "An Error as Occurred", statusCode: response.status }
            }
        },

        addStateToProject: async (projectName, state, credentials) => {
            const response = await fetch(`${url}/projects/${projectName}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `${credentials?.type} ${credentials?.content.value}`,
                    'Content-Type': "application/json"
                },
                body: JSON.stringify([{ op: 'add', path: 'state', value: state }])
            })

            if (response.ok) return { ok: response.ok, message: `Allowed State ${state} added`, statusCode: response.status }

            else {
                if (response.headers.get("Content-Type") == "application/problem+json") {
                    const resp = await response.json()
                    return { ok: response.ok, message: resp.detail, statusCode: response.status }
                }

                return { ok: response.ok, message: "An Error as Occurred", statusCode: response.status }
            }
        },

        removeStateFromProject: async (projectName, state, credentials) => {
            const response = await fetch(`${url}/projects/${projectName}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `${credentials?.type} ${credentials?.content.value}`,
                    'Content-Type': "application/json"
                },
                body: JSON.stringify([{ op: 'remove', path: 'state', value: state }])
            })

            if (response.ok) return { ok: response.ok, message: `Allowed State ${state} removed`, statusCode: response.status }

            else {
                if (response.headers.get("Content-Type") == "application/problem+json") {
                    const resp = await response.json()
                    return { ok: response.ok, message: resp.detail, statusCode: response.status }
                }

                return { ok: response.ok, message: "An Error as Occurred", statusCode: response.status }
            }
        },

        deleteProject: async (projectName, credentials) => {
            const response = await fetch(`${url}/projects/${projectName}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `${credentials?.type} ${credentials?.content.value}`,
                    'Content-Type': "application/json"
                }
            })

            if (response.ok) return { ok: response.ok, message: `Deleted Project ${projectName}`, statusCode: response.status }

            else {
                if (response.headers.get("Content-Type") == "application/problem+json") {
                    const resp = await response.json()
                    return { ok: response.ok, message: resp.detail, statusCode: response.status }
                }

                return { ok: response.ok, message: "An Error as Occurred", statusCode: response.status }
            }
        },

        addStateTransition: async (projectName, previousState, nextState, credentials) =>{
            const response = await fetch(`${url}/projects/${projectName}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `${credentials?.type} ${credentials?.content.value}`,
                    'Content-Type': "application/json"
                },
                body: JSON.stringify([{ op: 'add', path: 'stateTransition', value: `${previousState}->${nextState}`}])
            })

            if (response.ok) return { ok: response.ok, message: `State Transition ${previousState}->${nextState} added`, statusCode: response.status }

            else {
                if (response.headers.get("Content-Type") == "application/problem+json") {
                    const resp = await response.json()
                    return { ok: response.ok, message: resp.detail, statusCode: response.status }
                }

                return { ok: response.ok, message: "An Error as Occurred", statusCode: response.status }
            }
        },

        removeStateTransition: async (projectName, previousState, nextState, credentials) =>{
            const response = await fetch(`${url}/projects/${projectName}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `${credentials?.type} ${credentials?.content.value}`,
                    'Content-Type': "application/json"
                },
                body: JSON.stringify([{ op: 'remove', path: 'stateTransition', value: `${previousState}->${nextState}`}])
            })

            if (response.ok) return { ok: response.ok, message: `State Transition ${previousState}->${nextState} removed`, statusCode: response.status }
            else {
                if (response.headers.get("Content-Type") == "application/problem+json") {
                    const resp = await response.json()
                    return { ok: response.ok, message: resp.detail, statusCode: response.status }
                }

                return { ok: response.ok, message: "An Error as Occurred", statusCode: response.status }
            }
        },
        changeIssueState: async (projectName: string, issueId: number, newState: string, credentials) => {
            const response = await fetch(`${url}/projects/${projectName}/issues/${issueId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `${credentials?.type} ${credentials?.content.value}`,
                        'Content-Type': "application/json"
                    },
                    body: JSON.stringify([{ op: 'replace', path: 'state', value: newState }])
                })

            if (response.ok) return { ok: response.ok, message: `State replaced. New state is ${newState}`, statusCode: response.status }

            else {
                if (response.headers.get("Content-Type") == "application/problem+json") {
                    const resp = await response.json()
                    return { ok: response.ok, message: resp.detail, statusCode: response.status }
                }

                return { ok: response.ok, message: "An Error as Occurred", statusCode: response.status }
            }
        }
    }
}


type IssueInputModel = { name: string | undefined, description: string | undefined, labels: string[] }
export interface Service {
    deleteProject : (name: string, credentials : UserSession.Credentials) => Promise<SubmitResponse>
    removeAllowedLabel: (projectName: string, label: string, credentials: UserSession.Credentials | undefined) => Promise<SubmitResponse>
    getProject(projectName: string): Promise<Siren.Entity<DTO.Project>>
    getProjects: (page: number) => Promise<Siren.CollectionEntity<DTO.Project>>
    getComments: (projectName: string, issueId: number, page: number) => Promise<Siren.CollectionEntity<DTO.Comment>>
    getIssue: (projectName: string, issueId: number) => Promise<Siren.Entity<DTO.Issue>>
    addComment: (projectName: string | undefined, issueId: number | undefined, text: string | undefined, credentials: UserSession.Credentials | undefined) => Promise<SubmitResponse>
    createProject: (project: ProjectSubmission, credentials: UserSession.Credentials) => Promise<SubmitResponse>
    addLabel: (projectName: string | undefined, issueId: number | undefined, label: string | undefined, credentials: UserSession.Credentials | undefined) => Promise<SubmitResponse>
    removeLabel: (projectName: string | undefined, issueId: number | undefined, label: string | undefined, credentials: UserSession.Credentials | undefined) => Promise<SubmitResponse>
    fetchEntity<T>(links: Siren.Link[], rel: string): Promise<T>
    createIssue: (projectName: string, issue: IssueInputModel, credentials: UserSession.Credentials | undefined) => Promise<SubmitResponse>
    addAllowedLabel: (projectName: string, label: string, credentials: UserSession.Credentials | undefined) => Promise<SubmitResponse>
    addStateToProject: (projectName: string, state: string, credentials: UserSession.Credentials | undefined) => Promise<SubmitResponse>
    removeStateFromProject: (projectName: string, state: string, credentials: UserSession.Credentials | undefined) => Promise<SubmitResponse>
    addStateTransition: (projectName:string, previousState:string, nextState:string, credentials: UserSession.Credentials)  => Promise<SubmitResponse> 
    removeStateTransition: (projectName:string, previousState:string, nextState:string,  credentials: UserSession.Credentials)  => Promise<SubmitResponse> 
    changeIssueState: (projectName: string, issueId: number, newState: string, credentials: UserSession.Credentials) => Promise<SubmitResponse>
}