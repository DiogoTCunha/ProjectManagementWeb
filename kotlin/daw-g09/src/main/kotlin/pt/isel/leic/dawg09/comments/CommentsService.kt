package pt.isel.leic.dawg09.comments

import org.jdbi.v3.core.Jdbi
import org.springframework.stereotype.Component
import pt.isel.leic.dawg09.authentication.UserInfo
import pt.isel.leic.dawg09.dto.PaginationProperties
import pt.isel.leic.dawg09.issues.IssueArchivedException
import pt.isel.leic.dawg09.issues.IssuesService
import pt.isel.leic.dawg09.outputModels.CommentListOutputModel
import pt.isel.leic.dawg09.outputModels.CommentOutputModel

@Component
class CommentsService(val jdbi: Jdbi) {

    companion object {
        const val COMMENT_TABLE = "comment"
        const val ISSUE_TABLE = "ISSUE"
    }

    fun getCommentsFromIssue(pageNumber: Int, pageSize: Int, issueId: Int): CommentListOutputModel =
        jdbi.inTransaction<CommentListOutputModel, Exception> { handle ->

            val issueIdFound = handle.createQuery("SELECT id from ${ISSUE_TABLE} where id = :issueId")
                .bind("issueId", issueId)
                .mapTo(Int::class.java)
                .findOne()

            if (issueIdFound.isEmpty) throw IssuesService.IssueNotFoundException("The issue $issueId doesn't exist")

            val collectionSize = handle.createQuery("SELECT count(*) from ${COMMENT_TABLE} where issue_id = :issueId")
                .bind("issueId", issueId)
                .mapTo(Int::class.java)
                .first()

            val projectName = handle.createQuery("SELECT project_name from ${ISSUE_TABLE} where id = :issueId")
                .bind("issueId", issueId)
                .mapTo(String::class.java)
                .findOne().get()

            val pageInfo = PaginationProperties(pageNumber, pageSize, collectionSize)

            if (collectionSize <= 0)
                return@inTransaction CommentListOutputModel(pageInfo, issueId, emptyList())

            val comments =
                handle.createQuery("SELECT * FROM $COMMENT_TABLE WHERE issue_id = :issueId LIMIT :limit OFFSET :offset")
                    .bind("limit", pageSize)
                    .bind("offset", pageNumber * pageSize)
                    .bind("issueId", issueId)
                    .mapTo(CommentOutputModel::class.java)
                    .list()

            return@inTransaction CommentListOutputModel(pageInfo, issueId, comments)
        }

    fun addComment(user: UserInfo, issueId: Int, commentText: String) =
        jdbi.useHandle<Exception> { handle ->


            handle.createCall("call addComment(:issueId, :text, :username)")
                .bind("username", user.name)
                .bind("text", commentText)
                .bind("issueId", issueId)
                .invoke()

        }


    fun isOwnerOfComment(userInfo: UserInfo, commentId: Int): Boolean =
        jdbi.withHandle<String, Exception> { handle ->
            val commentExists = handle.createQuery("select count(*) FROM $COMMENT_TABLE where id = :id")
                .bind("id", commentId)
                .mapTo(Int::class.java)
                .findFirst()
                .get() == 1

            if (!commentExists)
                throw NoSuchElementException("Comment $commentId does not exist")

            handle.createQuery("select from_username from $COMMENT_TABLE where id = :id")
                .bind("id", commentId)
                .mapTo(String::class.java)
                .findFirst()
                .get()
        }.compareTo(userInfo.name) == 0

    fun removeComment(commentId: Int) {
        jdbi.useHandle<Exception> {
            it.createUpdate("DELETE FROM $COMMENT_TABLE WHERE id = :commentId")
                .bind("commentId", commentId)
                .execute()
        }
    }
}

