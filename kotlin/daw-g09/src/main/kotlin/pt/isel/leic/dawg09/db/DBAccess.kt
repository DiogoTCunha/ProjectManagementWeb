package pt.isel.leic.dawg09.db

import org.jdbi.v3.core.Jdbi
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component

@Component
class DBAccess {

    companion object {
        private const val PROJECT_TABLE_NAME: String = "project"
        private const val ALLOWED_LABELS_TABLE_NAME: String = "allowed_labels"
        private const val ISSUE_TABLE_NAME: String = "issue"
        private const val COMMENT_TABLE_NAME: String = "comment"
        private const val LABEL_TABLE_NAME: String = "label"
        private const val COLLABORATOR_TABLE_NAME: String = "collaborator"
        private const val STATES_TRANSITIONS_TABLE_NAME: String = "states_transitions"
        private const val USERS_TABLE_NAME: String = "users"



        private const val selectAllProjectsQuery = "SELECT * FROM $PROJECT_TABLE_NAME LIMIT :limit OFFSET :offset"
        private const val selectProjectQuery = "SELECT * FROM $PROJECT_TABLE_NAME WHERE name = :name"
        private const val selectIssueQuery = "SELECT * FROM $ISSUE_TABLE_NAME WHERE id = :id"
        private const val selectCommentsFromIssueQuery = "SELECT * FROM $COMMENT_TABLE_NAME WHERE issue_id = :issueId LIMIT :limit OFFSET :offset"
        private const val selectAllowedLabelsFromProjectQuery =
            "SELECT * FROM $ALLOWED_LABELS_TABLE_NAME where project_name = :project_name"
        private const val selectIssuesFromProjectQuery =
            "SELECT * FROM $ISSUE_TABLE_NAME WHERE project_name = :project_name"

        private const val deleteCommentQuery = "DELETE FROM $COMMENT_TABLE_NAME WHERE id = :commentId"
        private const val addCommentQuery = "call addComment(:issueId, :text, :username)"
        private const val updateIssueStateQuery = "call changeIssueState (:issueId, :newState)"
    }



    @Autowired
    lateinit var jdbi: Jdbi

    fun validateUser(username: String, password: String): Boolean =
        jdbi.withHandle<Boolean, Exception> { handle ->
            handle.createQuery("select count(*) FROM ${USERS_TABLE_NAME} where username = :username AND password = :password")
                .bind("username", username)
                .bind("password", password)
                .mapTo(Int::class.java)
                .findFirst()
                .get() == 1
        }

}