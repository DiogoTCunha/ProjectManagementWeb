import React, { useContext, useEffect, useState } from 'react'
import { Issue } from '../common/Model'
import { UserSession } from '../login/UserSession'
import { Entity } from '../common/Siren'
import ReactMarkdown from 'react-markdown'


type IssueComponentProps = { issueId: number, projectName: string }
export function IssueComponent({ issueId, projectName }: IssueComponentProps) {
    const [allowedLabels, setAllowedLabels] = useState<string[]>([])
    const [stateTransitions, setStateTransitions] = useState<string[]>([])
    const [selectedLabel, setSelectedLabel] = useState<string>()
    const [issueEntity, setIssueEntity] = useState<Entity<Issue>>()

    const user = useContext(UserSession.Context)

    useEffect(() => {
        async function loadIssue() {
            if (!user) return;
            const issueEntity: Entity<Issue> = await user.service.getIssue(projectName, issueId)
            setIssueEntity(issueEntity)

            if (!user || !issueEntity) return;

            const project = await user.service.getProject(projectName)
            const labels = project.properties.allowedLabels.filter((label) => !issueEntity.properties.labels.includes(label))
            setStateTransitions(project.properties.stateTransitions)
            setAllowedLabels(labels)
            setSelectedLabel(labels[0])
        }

        if (!issueEntity) loadIssue()
    }, [issueEntity])

    const handleAddLabel = async () => {
        if (!user) return

        const resp = await user.service.addLabel(projectName, issueId, selectedLabel, user?.credentials)
        if (resp.statusCode == 401) user?.forceLogout("Invalid Credentials")
        else if (resp.ok) {
            if (!allowedLabels || !selectedLabel) return

            allowedLabels.splice(allowedLabels.indexOf(selectedLabel), 1)
            setSelectedLabel(allowedLabels[0])
            setIssueEntity(undefined)
        }
    }

    const handleOnChangeDropdown = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedLabel(e.target.value)
    }

    if (!issueEntity) return (<div className="ui active centered inline loader" />)

    return (
        <div>
            <h1 className="ui header" style={{ display: "inline-block", marginRight: "20px", marginBottom: "0px" }}>
                {issueEntity.properties.name}
            </h1>
            <StateComponent
                state={issueEntity.properties.state_name}
                statesTransitions={stateTransitions}
                projectName={projectName}
                issueId={issueId}
                onStateChange={() => setIssueEntity(undefined)}
            ></StateComponent>
            <p>By <i><b>{issueEntity.properties.from_username}</b></i>, {issueEntity.properties.creation_date.split(" ")[0]}</p>
            <div className="ui segment">
                <div className="ui two column very relaxed grid">
                    <div className="ui column">
                        <ReactMarkdown>{issueEntity.properties.description}</ReactMarkdown>
                    </div>
                </div>
            </div>

            <div className="ui column">
                <div className="ui horizontal list">
                    {issueEntity.properties.labels ? issueEntity.properties.labels.map((label, index) => <LabelComponent onRemoveSuccess={() => setIssueEntity(undefined)} label={label} issueId={issueId} projectName={projectName} key={index} />) : <div className="ui active centered inline loader" />}
                </div>
                {
                    (issueEntity.properties.from_username == user?.credentials?.username && allowedLabels.length > 0) ?
                        <div className="ui two fields">
                            <select id="allowedLabelSelection" className="ui search dropdown" onChange={handleOnChangeDropdown}>
                                {allowedLabels.map((label, index) => <option value={label} key={index}>{label}</option>)}
                            </select>
                            <button className="ui secondary small button" type="button" style={{ margin: "10px" }} onClick={handleAddLabel}> Add Label</button>
                        </div>
                        : <></>
                }
            </div>
        </div>
    )
}

type LabelProps = { label: string, issueId: number | undefined, projectName: string | undefined, onRemoveSuccess: () => void }
export function LabelComponent({ label, issueId, projectName, onRemoveSuccess }: LabelProps) {
    const userSession = useContext(UserSession.Context)

    async function handleRemoveLabel() {
        if (!userSession) return;

        const resp = await userSession.service?.removeLabel(projectName, issueId, label, userSession?.credentials)

        if ( resp.statusCode == 401) userSession?.forceLogout("Invalid Credentials")
        //TODO RESPONSE 403 show error
        onRemoveSuccess()
    }

    return (
        <div className="item">
            <div className="ui label">
                {label} <i className="delete icon" onClick={handleRemoveLabel}></i>
            </div>
        </div>
    )
}

type StateProps = { state: string, statesTransitions: string[], issueId: number, projectName: string, onStateChange: () => void}
export function StateComponent({ state, statesTransitions, issueId, projectName, onStateChange }: StateProps) {
    const [isEditing, setIsEditing] = useState<boolean>(false)
    const [selectedState, setSelectedState] = useState<string>()
    const [availableStates, setAvailableStates] = useState<string[]>()

    const user = useContext(UserSession.Context)

    const handleClick = () => {
        const possibleStates = statesTransitions.map((transition) => {
            const states = transition.split("->")
            return { previousState: states[0], nextState: states[1] }
        }).filter((transition) => transition.previousState == state)
            .map((transition) => transition.nextState)

        setSelectedState(possibleStates[0])
        setAvailableStates(possibleStates)

        if(possibleStates.length > 0)
            setIsEditing((isEditing) => !isEditing)
    }

    const onSave = async () => {
        if (!user || !user.credentials || !selectedState) return

        await user.service.changeIssueState(projectName, issueId, selectedState, user.credentials)
        onStateChange()
    }

    const handleOnChangeDropdown = (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedState(e.target.value)

    return (
        <div style={{ display: "inline-block" }}>
            {
                isEditing ?
                    <div>
                        <select id="allowedLabelSelection" className="ui search dropdown" onChange={handleOnChangeDropdown} style={{ marginRight: "10px" }}>
                            {availableStates ?
                                availableStates.map((nextState) => <option key={nextState}>{nextState}</option>)
                                : <p>No available states</p>
                            }
                        </select>
                        <div className="ui buttons" style={{ marginTop: "10px" }}>
                            <button className="ui small button" onClick={handleClick}>Cancel</button>
                            <div className="or"></div>
                            <button className="ui small positive button" onClick={onSave}>Save</button>
                        </div>
                    </div>
                    :
                    <a className="ui tag label" onClick={handleClick}>{state}</a>
            }
        </div>
    )
}

type AllowedLabelProps = { label: string }
export function AllowedLabelComponent({ label }: AllowedLabelProps) {
    return (
        <option value={label}>{label}</option>
    )
}