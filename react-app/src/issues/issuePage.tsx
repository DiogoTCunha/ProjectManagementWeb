import { useContext, useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { UserSession } from '../login/UserSession'
import { IssueComponent } from './issueComponents'
import { CollectionEntity } from '../common/Siren'
import { Comment } from '../common/Model'
import { PageInfo } from '../projectsPage/ProjectsPage'

import './issuePage.css'


export type IssuePageParams = { projectName: string, issueId: string }
export function IssuePage() {
    const { projectName, issueId } = useParams<IssuePageParams>()

    if (isNaN(+issueId)) return (<p>burro</p>)
    return (
        <div className="project-page-element">
            <div className="ui segment">
                <IssueComponent issueId={parseInt(issueId)} projectName={projectName} />
                <CommentsContainer projectName={projectName} issueId={parseInt(issueId)} />
            </div>
        </div>
    )
}

type CommentProps = { comment: Comment }
export function CommentComponent({ comment }: CommentProps) {
    return (
        <div className="comment">
            <div className="content">
                <div className="author">{comment?.from_username}</div>
                <div className="metadata">
                    <span className="date">{comment?.date}</span>
                </div>
                <div className="text">
                    {comment?.text}
                </div>
                <div className="ui divider"></div>
            </div>
        </div>
    )
}

type CommentsContainerProps = { projectName: string, issueId: number }
function CommentsContainer({ projectName, issueId }: CommentsContainerProps) {
    const [commentsCollection, setCommentsCollection] = useState<CollectionEntity<Comment>>()
    const [pageInfo, setPageInfo] = useState<PageInfo>({ currentPage: 0, pageSize: 0, collectionSize: 0 })

    useEffect(() => {
        async function loadComments() {
            if (!user) return;
            const commentsCollection: CollectionEntity<Comment> = await user.service.getComments(projectName, issueId, pageInfo?.currentPage)
            setPageInfo(commentsCollection.properties)
            setCommentsCollection(commentsCollection)
        }
        if (!commentsCollection) loadComments()
    }, [commentsCollection])

    const commentTextInputRef = useRef<HTMLInputElement>(null)
    const user = useContext(UserSession.Context)

    async function handleSubmit() {
        if (!user) return

        const commentText = commentTextInputRef.current?.value
        await user.service.addComment(projectName, issueId, commentText, user?.credentials)
        setCommentsCollection(undefined)
    }

    const handleNextPage = () => {
        setPageInfo({ currentPage: pageInfo.currentPage + 1, pageSize: pageInfo.pageSize, collectionSize: pageInfo.pageSize })
        setCommentsCollection(undefined)
    }

    const handlePreviousPage = () => {
        setPageInfo({ currentPage: pageInfo.currentPage - 1, pageSize: pageInfo.pageSize, collectionSize: pageInfo.pageSize })
        setCommentsCollection(undefined)
    }

    return (
        <div className="ui segment">
            {
                ((pageInfo.currentPage + 1) * pageInfo.pageSize < pageInfo.collectionSize) ?
                    <button className="ui right floated secondary button" onClick={handleNextPage}>Next Page</button>
                    : <></>
            }
            {
                (pageInfo.currentPage > 0) ?
                    <button className="ui right floated secondary button" onClick={handlePreviousPage}>Previous Page</button>
                    : <></>
            }
            <div className="ui comments">
                {
                    commentsCollection ?
                        commentsCollection.entities.map((comment, index) =>
                            <CommentComponent
                                comment={comment.properties}
                                key={index}
                            />
                        )
                        : <div className="ui active centered inline loader" />
                }
            </div>
            <form className='ui large form'>
                <input type="text" name="comment" placeholder="Write a comment" ref={commentTextInputRef} />
                <button className="ui fluid large submit button" type="button" onClick={handleSubmit} ></button>
            </form>
        </div>
    )
}
