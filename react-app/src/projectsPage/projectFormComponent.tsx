import { useContext, useRef, useState } from "react"
import { UserSession } from "../login/UserSession"
import { Service, SubmitResponse } from '../service/Service'


export type ProjectFormProps = {
    onMessage : (message : SubmitResponse) => void
}

export function ProjectFormComponent(props : ProjectFormProps) {
    const projectNameRef = useRef<HTMLInputElement>(null)
    const initialStateRef = useRef<HTMLInputElement>(null)
    const descriptionRef = useRef<HTMLInputElement>(null)
    const labelsRef = useRef<HTMLInputElement>(null)
    const userSession = useContext(UserSession.Context)


    


    const handleSubmit = async (evt: any) => {

        evt.preventDefault()

        const projectName = projectNameRef.current?.value
        const initialState = initialStateRef.current?.value
        const description = descriptionRef.current?.value
        const labels = labelsRef.current?.value

        if (!labels || !initialState || !description || !projectName || !userSession || !userSession.credentials) return

        const formatedLabels = labels.split(";").map((label => label.trim()))
        if(!userSession) return;
        const resp = await userSession.service.createProject({ name: projectName, description, initialState, allowedLabels: formatedLabels }, userSession.credentials)

        if (resp.statusCode == 401) userSession.forceLogout("Invalid Credentials")

        props.onMessage(resp)

    }

    return (
        <div className="ui segment">
            <form className="ui form" onSubmit={handleSubmit}>
                <div className="two fields">
                    <div className="three wide field">
                        <label>Project Name</label>
                        <input type="text" name="project-name" placeholder="Project Name" required ref={projectNameRef} />
                    </div>
                    <div className="two wide field">
                        <label>Initial State</label>
                        <input type="text" name="last-name" placeholder="Initial State" required ref={initialStateRef} />
                    </div>
                </div>
                <div className="five wide field">
                    <label>Description</label>
                    <input type="text" name="last-name" placeholder="Description" required ref={descriptionRef} />
                </div>
                <div className="five wide field">
                    <label>Labels</label>
                    <input type="text" name="last-name" placeholder="separated by ;" required ref={labelsRef} />
                </div>

                <button className="ui secondary button" type="submit">Submit</button>

            </form>
        </div>
    )
}