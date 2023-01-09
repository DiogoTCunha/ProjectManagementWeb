export type Project = {
    name: string,
    description : string,
    initialState: string,
    projectOwner: string,
    allowedLabels: string[],
    allowedStates: string[],
    stateTransitions: string[]
}

export type Comment = {
    id: number,
    date: string,
    from_username: string,
    text: string,
    issue_id: number
}

export type Issue = {
    id: number,
    name: string,
    project_name: string,
    description: string,
    creation_date: string,
    from_username: string,
    state_name: string,
    labels: string[]
}

export type AllowedLabel = {
    label: string
}

