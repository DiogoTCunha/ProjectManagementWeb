package pt.isel.leic.dawg09.issues

import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.statement.UnableToExecuteStatementException
import org.postgresql.util.PSQLException
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component
import pt.isel.leic.dawg09.dto.PaginationProperties
import pt.isel.leic.dawg09.outputModels.IssueListOutputModel
import pt.isel.leic.dawg09.outputModels.IssueOutputModel
import pt.isel.leic.dawg09.outputModels.ProjectOutputModel
import pt.isel.leic.dawg09.project.ProjectNotFoundException
import java.sql.SQLException
import java.text.SimpleDateFormat
import java.util.*
import kotlin.NoSuchElementException


@Component
class IssuesService(val jdbi: Jdbi) {

    companion object {
        const val ISSUE_TABLE = "issue"
        const val LABEL_TABLE = "label"
        const val PROJECT_TABLE = "project"
    }

    fun getIssues(projectName : String, pageNumber: Int, pageSize: Int): IssueListOutputModel =
        jdbi.inTransaction<IssueListOutputModel, Exception> { handle ->
            val projectNameFound = handle.createQuery("SELECT name from ${PROJECT_TABLE} where name = :projectName")
                    .bind("projectName", projectName)
                    .mapTo(String::class.java)
                    .findOne()

            if(projectNameFound.isEmpty) throw ProjectNotFoundException("The project $projectName doesn't exist")

            val collectionSize = handle.createQuery("SELECT count(*) from ${ISSUE_TABLE} where project_name = :projectName")
                .bind("projectName", projectName)
                .mapTo(Int::class.java)
                .first()

            val pageInfo = PaginationProperties(pageNumber,pageSize,collectionSize)

            if(collectionSize <= 0)
                return@inTransaction IssueListOutputModel(pageInfo,projectName, emptyList())

            val issues = handle.createQuery("SELECT * from ${ISSUE_TABLE} where project_name = :projectName " +
                    "LIMIT :pageSize OFFSET :start")
                .bind("projectName", projectName)
                .bind("pageSize", pageSize)
                .bind("start", (pageNumber-1) * pageSize )
                .mapTo(IssueOutputModel::class.java)
                .list()

            return@inTransaction IssueListOutputModel(pageInfo,projectName, issues)

        }

    fun createIssue(projectName: String, issue : IssueInputModel, user : String) : IssueOutputModel =
        jdbi.inTransaction<IssueOutputModel, Exception>{ handle ->
            val initialState =handle.createQuery("SELECT initial_state_name FROM $PROJECT_TABLE " +
                    "WHERE name = :projectName")
                .bind("projectName", projectName)
                .mapTo(String::class.java)
                .findFirst()

            if(initialState.isEmpty) throw NoSuchElementException("The project $projectName doesn't exist")

            val formatter = SimpleDateFormat("yyyy/MM/dd HH:mm:ss")
            val date = Date()

            val returnedIssued = handle.createQuery("INSERT INTO $ISSUE_TABLE (name,description, creation_date, from_username,state_name,project_name)" +
                    " VALUES (:name,:description, :creation_date, :user,:initialState,:projectName) " +
                    "returning *")
                .bind("name",issue.name)
                .bind("description",issue.description)
                .bind("user",user)
                .bind("initialState", initialState)
                .bind("projectName", projectName)
                .bind("creation_date", date)
                .mapTo(IssueOutputModel::class.java)
                .one()


            if(issue.labels == null) return@inTransaction returnedIssued


            var currlabel =  ""
            try{
                for (label: String in issue.labels) {
                    currlabel = label
                    handle.createUpdate(
                        "INSERT INTO LABEL (name,project_name, issue_id)" +
                                "VALUES (:name,:project_name, :issue_id)"
                    )
                    .bind("name", label)
                    .bind("project_name", projectName)
                    .bind("issue_id", returnedIssued.id)
                    .execute()
                }
            }catch(ex : UnableToExecuteStatementException){
                throw InvalidLabelForIssueException("Label \"$currlabel\" doesn't exist on project \"$projectName\"")
            }


            return@inTransaction returnedIssued
        }

    fun getIssue(projectName: String, issueId : Int) =
        jdbi.withHandle<IssueOutputModel, Exception> { handle ->
            val issueOpt = handle
                .createQuery("SELECT * FROM getIssue(:issueID)")
                .bind("issueID", issueId)
                .mapTo(IssueOutputModel::class.java)
                .findOne()


            if(issueOpt.isEmpty || issueOpt.get().project_name != projectName){
                throw IssueNotFoundException("Issue doesn't exist")
            }

            return@withHandle issueOpt.get()
        }

    fun deleteIssue(issueId : Int){
            jdbi.useHandle<Exception> { handle ->
                handle
                    .createCall("call deleteIssue(:issueId)")
                    .bind("issueId", issueId)
                    .invoke()
            }
    }

    fun addLabel(issueId : Int, projectName: String, label: String){
        jdbi.useHandle<Exception> { handle ->
            handle
                .createUpdate("INSERT INTO $LABEL_TABLE VALUES (:label, :projectName, :issueId)")
                .bind("label", label)
                .bind("issueId", issueId)
                .bind("projectName", projectName)
                .execute()
        }
    }

    fun removeLabel(issueId : Int, projectName: String, label: String){
        jdbi.useHandle<Exception> { handle ->
            handle
                .createUpdate("DELETE FROM $LABEL_TABLE WHERE issue_id = :issueId AND name = :label")
                .bind("label", label)
                .bind("issueId", issueId)
                .execute()
        }
    }

    fun changeState(issueId: Int, projectName: String, state: String) {
        try{
            return jdbi.useHandle<Exception> { handle ->
                    handle
                        .createCall("call changeIssueState(:issueId, :newState)")
                        .bind("issueId", issueId)
                        .bind("newState", state)
                        .invoke()
                }

            }
        catch(ex : Exception){
            println(ex.message)
            throw TransitionNotPossibleException("This state transition is not allowed")
        }
    }


    class InvalidLabelForIssueException(s: String) : Exception(s)

    class IssueNotFoundException(s: String) : Exception(s)

    class TransitionNotPossibleException(s: String) : Exception(s)

}

