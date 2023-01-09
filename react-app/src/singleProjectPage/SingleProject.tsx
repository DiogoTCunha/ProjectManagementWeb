import React, { useContext, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Issue, Project } from '../common/Model'
import { CollectionEntity, Entity, SubEntity } from '../common/Siren'
import { SubmitResponse } from '../service/Service'
import { UserSession } from "../login/UserSession"

import './singleProject.css'
import { AllowedLabelComponent } from '../issues/issueComponents'


type projectParams = { projectName: string }
export function ProjectComponent() {
    const { projectName } = useParams<projectParams>()
    const [projectEntity, setProjectEntity] = useState<Entity<Project>>()
    const [issuesEntityCollection, setIssuesEntityCollection] = useState<CollectionEntity<Issue> | undefined>()
    const [projectLoaded, setProjectLoaded] = useState<boolean>(false)
    const [creatingIssue, setCreatingIssue] = useState<boolean>(false)

    const userSession = useContext(UserSession.Context)

    useEffect(() => {
        async function loadProject() {
            if (!userSession) return

            const project: Entity<Project> = await userSession?.service.getProject(projectName)
            setProjectLoaded(true)
            setProjectEntity(project)
            console.log(project)
        }
        if (!projectEntity) loadProject()
    }, [projectEntity, projectName])

    useEffect(() => {
        async function loadIssues() {
            if (!projectEntity || !userSession) return
            const issues: CollectionEntity<Issue> = await userSession?.service.fetchEntity(projectEntity.links, "Issues")
            setIssuesEntityCollection(issues)
        }
        if (projectEntity && !issuesEntityCollection) loadIssues()
    }, [issuesEntityCollection, projectEntity])

    const handleOpenCreateIssueForm = () => setCreatingIssue((creatingIssues) => (!creatingIssues))

    if (!projectLoaded) return (<div className="ui active centered inline loader" />)

    return (projectEntity ? (
        <div className="project-page-element">
            <div className="ui segment">
                <h1 className="ui header">{projectName}</h1>
                <p>{projectEntity?.properties.description}</p>
                <div className="ui segment">
                    <div className="ui two column very relaxed grid">
                        <AllowedLabelsContainer
                            projectName={projectName}
                            allowedLabels={projectEntity.properties.allowedLabels}
                            refresh={() => setProjectEntity(undefined)
                            }
                        ></AllowedLabelsContainer>
                        <StatesContainer
                            projectName={projectName}
                            states={projectEntity.properties.allowedStates}
                            refresh={() => setProjectEntity(undefined)}
                        ></StatesContainer>
                    </div>
                    <div className="ui vertical divider"><i className="sort icon"></i></div>
                </div>
                <div className="ui segment">
                    <div className="ui two column very relaxed grid">
                        <StateTransitionsContainer
                            projectName={projectName}
                            states={projectEntity.properties.allowedStates}
                            stateTransitions={projectEntity.properties.stateTransitions}
                            refresh={() => setProjectEntity(undefined)
                            }
                        ></StateTransitionsContainer>
                        <StateTransitionsAdder
                            projectName={projectName}
                            states={projectEntity.properties.allowedStates}
                            stateTransitions={projectEntity.properties.stateTransitions}
                            refresh={() => setProjectEntity(undefined)}
                        ></StateTransitionsAdder>
                    </div>
                    <div className="ui vertical divider"><i className="sort icon"></i></div>
                </div>

                <button className="ui blue button" onClick={handleOpenCreateIssueForm}>Create Issue</button>
                {
                    creatingIssue ? <CreateIssue
                        allowedLabels={projectEntity.properties.allowedLabels}
                        initialState={projectEntity.properties.initialState}
                        projectName={projectName}
                        onSuccess={() => setIssuesEntityCollection(undefined)}
                    /> : <></>
                }
                <div className="ui segment">
                    <div className="column">
                        <h2 className="ui header">Issues</h2>
                        <div className="ui divider"></div>
                        <div className="ui relaxed divided list">
                            {issuesEntityCollection?.entities?.length ? "" : "There are no issues"}
                            {issuesEntityCollection?.entities?.map(subEntity => <IssueComponent issue={subEntity} key={subEntity.properties?.id}></IssueComponent>)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    ) : <h1>Project doesn't exist</h1>)
}


//Issues
type IssueComponentProps = { issue: SubEntity<Issue> }
function IssueComponent({ issue }: IssueComponentProps) {
    return (
        <div className="item">
            <i className="middle aligned code icon"></i>
            <div className="content">
                <a className="header" href={issue.links?.filter(linkObj => linkObj.rel.includes("self"))[0].href}>{issue.properties?.name}</a>
                <div className="description">opened on {
                    issue.properties?.creation_date.split(" ")[0]
                } by {issue.properties?.from_username}</div>
            </div>
        </div>
    )
}
type CreateIssueProps = { allowedLabels: string[], initialState: string, projectName: string, onSuccess: () => void }
function CreateIssue({ allowedLabels, initialState, projectName, onSuccess }: CreateIssueProps) {
    const issueNameRef = useRef<HTMLInputElement>(null)
    const descriptionRef = useRef<HTMLTextAreaElement>(null)
    const userSession = useContext(UserSession.Context)

    const [response, setResponseMessage] = useState<SubmitResponse | undefined>(undefined)
    const [selectedLabel, setSelectedLabel] = useState<string>(allowedLabels[0])
    const [labels, setLabels] = useState<string[]>([])

    const handleSubmit = async (evt: any) => {
        evt.preventDefault()
        setResponseMessage(undefined)

        const issueName = issueNameRef.current?.value
        const description = descriptionRef.current?.value
        if ((!issueName && !description) || !userSession || !userSession.credentials) return

        const resp = await userSession.service.createIssue(
            projectName,
            { name: issueName, description: description, labels: labels },
            userSession?.credentials
        )

        if (resp.statusCode == 401) userSession.forceLogout("Invalid Credentials")
        setResponseMessage(resp)
        onSuccess()

    }

    const handleOnChangeDropdown = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedLabel(e.target.value)
        console.log("SELECTED " + e.target.value)
    }

    const handleAddLabel = () => {
        if (labels.includes(selectedLabel) || selectedLabel == undefined) return

        setSelectedLabel(allowedLabels[1])
        setLabels(labels.concat(selectedLabel))
        allowedLabels.splice(allowedLabels.indexOf(selectedLabel), 1)
    }

    const handleRemoveLabel = (label: string) => {
        if (allowedLabels.length == 0) setSelectedLabel(label)

        setLabels(labels.filter(lbl => lbl !== label))
        allowedLabels.push(label)
    }

    return (
        <div className="ui segment">
            <form className="ui form" onSubmit={handleSubmit}>
                {response ?
                    <div className={response.ok ? "ui positive message" : "ui negative message"}>
                        <i className="close icon" onClick={() => setResponseMessage(undefined)}></i>
                        <div className="header">
                            {response.message}
                        </div>
                    </div> : <></>}
                <div className="two fields">
                    <div className="three wide field">
                        <label>Issue Name</label>
                        <input type="text" name="project-name" placeholder="Issue Name" required ref={issueNameRef} />
                    </div>
                    <div className="two wide field" style={{ marginLeft: "8px" }}>
                        <label>Initial State</label>
                        <input type="text" name="project-name" value={initialState} disabled />
                    </div>
                </div>
                <div className="five wide field">
                    <label>Description</label>
                    <textarea rows={5} cols={60} name="description" ref={descriptionRef} required>
                    </textarea>
                </div>

                <div className="ui column">
                    {
                        labels.map((label, index) =>
                            <a className="ui label" key={index} style={{ marginBottom: "7px" }}>
                                {label}
                                <i className="delete icon" onClick={() => handleRemoveLabel(label)}></i>
                            </a>
                        )
                    }
                </div>

                {allowedLabels.length > 0 ?
                    (<div className="ui two column stackable grid">
                        <div className="ui column two wide field">
                            <select id="allowedLabelSelection" className="ui dropdown" onChange={handleOnChangeDropdown}>
                                {allowedLabels ? allowedLabels.map((label, index) => <AllowedLabelComponent label={label} key={index} />) : <div className="ui active centered inline loader" />}
                            </select>
                        </div>
                        <div className="ui column">
                            <button className="ui button" type="button" onClick={handleAddLabel} style={{ height: "40px" }}> Add Label</button>
                        </div></div>
                    ) :
                    <p>No more labels</p>

                }
                <button className="ui secondary button" type="submit">Submit</button>
            </form>
        </div >
    )
}

//Allowed Labels
type AllowedLabelProps = { projectName: string, label: string, onRemoveFail: () => void, onRemoveSuccess: () => void }
function AllowedLabel({ projectName, label, onRemoveSuccess, onRemoveFail }: AllowedLabelProps) {
    console.log("ALLOWED LABEL CALLED")
    const userSession = useContext(UserSession.Context)

    const handleDeleteLabel = async () => {
        if (!userSession) return

        const resp = await userSession.service.removeAllowedLabel(projectName, label, userSession.credentials)

        if (!resp.ok) {
            onRemoveFail()
            return
        }

        onRemoveSuccess()
    }

    return (
        <a className="ui label" style={{ marginBottom: "7px" }}>
            {label}
            <i className="delete icon" onClick={handleDeleteLabel}></i>
        </a>
    )
}
type AllowedLabelsContainerProps = { projectName: string, allowedLabels: string[], refresh: () => void }
function AllowedLabelsContainer({ projectName, allowedLabels, refresh }: AllowedLabelsContainerProps) {

    const [labelInUseWarning, setLabelInUseWarning] = useState<boolean>(false)
    const labelRef = useRef<HTMLInputElement>(null)
    const [response, setResponseMessage] = useState<SubmitResponse | undefined>(undefined)
    const userSession = useContext(UserSession.Context)

    const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.code == "Enter") {
            e.preventDefault()

            if (!userSession || !labelRef.current) return

            const label = labelRef.current.value
            const resp = await userSession.service.addAllowedLabel(projectName, label, userSession?.credentials)

            console.log(resp.ok)
            if (!resp.ok) {
                setResponseMessage(resp)
                return
            }
            refresh()
        }
    }

    return (

        <div className="ui column">
            <h3>Allowed Labels</h3>
            {labelInUseWarning ?
                <div className={"ui negative message"}>
                    <i className="close icon" onClick={() => setLabelInUseWarning(false)}></i>
                    <div className="header">
                        This label is still in use
                    </div>
                </div> : <></>}
            {allowedLabels ?
                allowedLabels.map((label, index) =>
                    <AllowedLabel
                        onRemoveFail={() => setLabelInUseWarning(true)}
                        onRemoveSuccess={() => refresh()}
                        projectName={projectName}
                        key={label}
                        label={label}></AllowedLabel>
                )
                :
                <></>}
            {response ?
                <div className={response.ok ? "ui positive message" : "ui negative message"}>
                    <i className="close icon" onClick={() => setResponseMessage(undefined)}></i>
                    <div className="header">{response.message}</div>
                </div> : <></>}

            <form className="ui form">
                <input type="text" name="project-name" placeholder="New Label" required onKeyPress={handleKeyPress} ref={labelRef} />
                <input type="submit" style={{ visibility: "hidden" }} />
            </form>
        </div>
    )
}

//Allowed States
type StateProps = { projectName: string, state: string, onRemoveFail: (message: string | undefined) => void, onRemoveSuccess: () => void }
function State({ projectName, state, onRemoveSuccess, onRemoveFail }: StateProps) {
    const userSession = useContext(UserSession.Context)

    const handleDeleteState = async () => {
        if (!userSession) return

        const resp = await userSession.service.removeStateFromProject(projectName, state, userSession.credentials)

        if (!resp.ok) {
            onRemoveFail(resp.message)
            return
        }

        onRemoveSuccess()
    }

    return (
        <a className="ui label" style={{ marginBottom: "7px" }}>
            {state}
            <i className="delete icon" onClick={handleDeleteState}></i>
        </a>
    )
}
type StatesContainerProps = { projectName: string, states: string[], refresh: () => void }
function StatesContainer({ projectName, states, refresh }: StatesContainerProps) {

    const [stateInUseWarning, setLabelInUseWarning] = useState<string | undefined>(undefined)
    const stateRef = useRef<HTMLInputElement>(null)
    const [response, setResponseMessage] = useState<SubmitResponse | undefined>(undefined)
    const userSession = useContext(UserSession.Context)

    const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.code == "Enter") {
            e.preventDefault()
            if (!userSession || !stateRef.current) return
            const resp = await userSession?.service.addStateToProject(projectName, stateRef.current.value, userSession?.credentials)
            if (!resp.ok) {
                setResponseMessage(resp)
                return
            }
            refresh()
        }
    }

    return (
        <div className="ui column">
            <h3>Allowed States</h3>
            {stateInUseWarning ?
                <div className={"ui negative message"}>
                    <i className="close icon" onClick={() => setLabelInUseWarning(undefined)}></i>
                    <div className="header">
                        {stateInUseWarning}
                    </div>
                </div> : <></>}
            {states ?
                states.map((state, index) =>
                    <State
                        onRemoveFail={(message) => setLabelInUseWarning(message ? message : "Error removing state")}
                        onRemoveSuccess={() => refresh()}
                        projectName={projectName}
                        key={state}
                        state={state}></State>
                )
                :
                <></>}
            {response ?
                <div className={response.ok ? "ui positive message" : "ui negative message"}>
                    <i className="close icon" onClick={() => setResponseMessage(undefined)}></i>
                    <div className="header"> You have inserted an invalid state</div>
                </div> : <></>}

            <form className="ui form">
                <input type="text" name="project-name" placeholder="New State" required onKeyPress={handleKeyPress} ref={stateRef} />
                <input type="submit" style={{ visibility: "hidden" }} />
            </form>
        </div>
    )
}


type StateTransitionsContainerProps = { projectName: string, states: string[], stateTransitions: string[], refresh: () => void }
function StateTransitionsContainer({ projectName, states, stateTransitions, refresh }: StateTransitionsContainerProps) {
    const [stateInUseWarning, setLabelInUseWarning] = useState<string | undefined>(undefined)
    const [response, setResponseMessage] = useState<SubmitResponse | undefined>(undefined)

    return (
        <div className="ui column">
            <h3>State Transitions</h3>
            {stateInUseWarning ?
                <div className={"ui negative message"}>
                    <i className="close icon" onClick={() => setLabelInUseWarning(undefined)}></i>
                    <div className="header">
                        {stateInUseWarning}
                    </div>
                </div> : <></>}
            {stateTransitions ?
                stateTransitions.map((stateTransition, index) =>
                    <StateTransition
                        onRemoveFail={(message) => setLabelInUseWarning(message ? message : "Error removing state")}
                        onRemoveSuccess={() => refresh()}
                        projectName={projectName}
                        key={index}
                        stateTransition={stateTransition}></StateTransition>
                ) : <></>}
            {response ?
                <div className={response.ok ? "ui positive message" : "ui negative message"}>
                    <i className="close icon" onClick={() => setResponseMessage(undefined)}></i>
                    <div className="header"> You have inserted an invalid state</div>
                </div> : <></>}

        </div>
    )
}



//Allowed States
type StateTransitionProps = { projectName: string, stateTransition: string, onRemoveFail: (message: string | undefined) => void, onRemoveSuccess: () => void }
function StateTransition({ projectName, stateTransition, onRemoveSuccess, onRemoveFail }: StateTransitionProps) {
    const userSession = useContext(UserSession.Context)

    const handleDeleteState = async () => {
        if (!userSession || !userSession.credentials) return

        const [previousTransition, nextTransition] = stateTransition.split("->")
        const resp = await userSession.service.removeStateTransition(projectName, previousTransition, nextTransition, userSession.credentials)

        if (!resp.ok) {
            onRemoveFail(resp.message)
            return
        }

        onRemoveSuccess()
    }

    return (
        <a className="ui label" style={{ marginBottom: "7px" }}>
            {stateTransition}
            <i className="delete icon" onClick={handleDeleteState}></i>
        </a>
    )
}

type StateTransitionsAdderProps = { projectName: string, states: string[], stateTransitions: string[], refresh: () => void }
function StateTransitionsAdder({ projectName, states, stateTransitions, refresh }: StateTransitionsAdderProps) {
    const [response, setResponseMessage] = useState<SubmitResponse | undefined>(undefined)
    const [previousState, setPreviousState] = useState<string>(states[0])
    const [nextState, setNextState] = useState<string>(states[0])
    const userSession = useContext(UserSession.Context)
    console.log(states)

    const handlePreviousStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPreviousState(e.target.value)
    }

    const handleNextStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setNextState(e.target.value)
    }

    const onSubmitHandle = async (e: any) => {
        e.preventDefault()
        if (previousState == nextState) {
            setResponseMessage({ ok: false, statusCode: 0, message: "Previous and next state can't be the same" })
            return
        }
        if (stateTransitions.includes(`${previousState}->${nextState}`)) {
            setResponseMessage({ ok: false, statusCode: 0, message: "Transition already exists" })
            return
        }
        if (userSession && userSession.credentials) {
            await userSession.service.addStateTransition(projectName, previousState, nextState, userSession.credentials)
            refresh()
        }

    }


    return (
        <div className="ui column">
            <h3>State Transitions</h3>

            {response ?
                <div className={response.ok ? "ui positive message" : "ui negative message"}>
                    <i className="close icon" onClick={() => setResponseMessage(undefined)}></i>
                    <div className="header">{response.message}</div>
                </div> : <></>}

            <form className="ui form" onSubmit={onSubmitHandle}>
                <div className="ui stackable grid">
                    <div className="four wide column">
                        <select id="prevStateSelection" className="ui dropdown" onChange={handlePreviousStateChange}>
                            {states ? states.map((state, index) => <option value={state}>{state}</option>) : <></>}
                        </select>
                    </div>
                    <div className="one wide column">
                        <p><i className="arrow right icon" style={{ top: "30%", left: "20%", position: "absolute" }}></i></p>
                    </div>
                    <div className="four wide column">
                        <select id="nextStateSelection" className="ui dropdown" onChange={handleNextStateChange}>
                            {states ? states.map((state, index) => <option key={index} value={state}>{state}</option>) : <></>}
                        </select>
                    </div>
                    <div className="column">
                        <button type="submit" className="ui green button"><i className="check icon"></i></button>
                    </div>
                </div>
            </form>


        </div>
    )
}





