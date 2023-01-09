import { useState } from "react";
import { Redirect } from "react-router";
import { UserSession } from "./UserSession";

export type BlankPageProps = {
    session: UserSession.Repository
}

export function Blank(props: BlankPageProps) {

    const [isSignedOut, signOut] = useState<Boolean>(false)
    return (
        isSignedOut ? <Redirect to = "/login" /> :
        <div>THIS IS A BLANK PAGE
            <button className = "ui mini basic icon button" 
            onClick = { () => {props.session.logout(); signOut(true) }}>
                <i className = "sign-out icon"/>
            </button>
        </div>
        
    )

}