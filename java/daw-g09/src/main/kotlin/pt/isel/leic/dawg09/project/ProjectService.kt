package pt.isel.leic.dawg09.project

import org.jdbi.v3.core.Jdbi
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component
import org.springframework.web.bind.annotation.PatchMapping
import pt.isel.leic.dawg09.authentication.UserInfo
import pt.isel.leic.dawg09.dto.PaginationProperties
import pt.isel.leic.dawg09.issues.IssuesService
import pt.isel.leic.dawg09.outputModels.*
import java.util.*

@Component
class ProjectService(val jdbi: Jdbi) {

    companion object {
        const val ALLOWED_LABELS_TABLE = "ALLOWED_LABELS"
        const val PROJECT_TABLE = "project"
    }

    fun getProjects(currentPage: Int, pageSize: Int): Pair<PaginationProperties, List<ProjectOutputModel>> =
        jdbi.withHandle<Pair<PaginationProperties, List<ProjectOutputModel>>, Exception> { handle ->
            val projects = handle
                .createQuery("SELECT * FROM $PROJECT_TABLE LIMIT :limit OFFSET :offset")
                .bind("limit", pageSize)
                .bind("offset", currentPage * pageSize)
                .map { rs, _ ->
                    return@map ProjectOutputModel(
                        name = rs.getString("name"),
                        description = rs.getString("description"),
                        initialState = rs.getString("initial_state_name"),
                        projectOwner = rs.getString("owner_username")
                    )
                }.list()

            val count: Int = handle.createQuery("SELECT COUNT(*) FROM $PROJECT_TABLE")
                .mapTo(Int::class.java)
                .findFirst()
                .get()

            return@withHandle Pair(PaginationProperties(currentPage, pageSize, count), projects)
        }

    fun getProject(projectName: String): ProjectOutputModel =
        jdbi.withHandle<ProjectOutputModel, Exception> { handle ->
            val optionalProject = handle
                .createQuery("SELECT * FROM getProject(:projectName)")
                .bind("projectName", projectName)
                .mapTo(ProjectOutputModel::class.java)
                .findOne()

            if (optionalProject.isEmpty) throw ProjectNotFoundException("Project $projectName doesn't exist")

            return@withHandle optionalProject.get()
        }

    fun createProject(user: UserInfo, project: ProjectInputModel) =
        jdbi.useHandle<Exception> { handle ->
            val initialState = handle.createQuery(
                "SELECT initial_state_name FROM $PROJECT_TABLE " +
                        "WHERE name = :projectName"
            )
                .bind("projectName", project.name)
                .mapTo(String::class.java)
                .findFirst()

            if (!initialState.isEmpty) throw ProjectAlreadyExistsException("The project ${project.name} already exists")

            handle.createCall("call createProject(:projectName,:description,:initialState, :owner)")
                .bind("projectName", project.name)
                .bind("description", project.description)
                .bind("initialState", project.initialState)
                .bind("owner", user.name)
                .invoke()

            for (label in project.allowedLabels) {
                handle.createUpdate("insert into allowed_labels values(:labelName, :projectName)")
                    .bind("projectName", project.name)
                    .bind("labelName", label)
                    .execute()
            }
        }

    fun deleteProject(projectName: String) =
        jdbi.useHandle<Exception> { handle ->
            handle
                .createCall("call deleteproject(:projectName)")
                .bind("projectName", projectName)
                .invoke()
        }


    fun addLabel(projectName: String, label: String) = jdbi.useHandle<Exception> { handle ->
        handle.createUpdate("insert into allowed_labels values(:labelName, :projectName)")
            .bind("projectName", projectName)
            .bind("labelName", label)
            .execute()
    }

    fun removeLabel(projectName: String, label: String) = jdbi.useHandle<Exception> { handle ->
        handle.createUpdate("delete from allowed_labels where name = :labelName AND project_name = :projectName")
            .bind("labelName", label)
            .bind("projectName", projectName)
            .execute()
    }

    fun addState(projectName: String, state: String) = jdbi.useHandle<Exception> { handle ->
        handle.createUpdate("insert into allowed_states values(:stateName, :projectName)")
            .bind("projectName", projectName)
            .bind("stateName", state)
            .execute()
    }

    fun removeState(projectName: String, state: String) = jdbi.useTransaction<Exception> { handle ->
        handle.createUpdate("delete from states_transitions where previous_state_name = :state or next_state_name = :state")
            .bind("state", state)
            .execute()

        handle.createUpdate("delete from allowed_states where name = :stateName")
            .bind("stateName", state)
            .execute()
    }

    fun addStateTransition(projectName: String, previousState: String, nextState: String) =
        jdbi.useHandle<Exception> { handle ->
            try {
                handle.createUpdate("insert into states_transitions values(:previousState, :nextState, :projectName)")
                    .bind("previousState", previousState)
                    .bind("nextState", nextState)
                    .bind("projectName", projectName)
                    .execute()
            }catch(ex : Exception){
                throw UnableToAddTransitionException("Couldn't add transition")
            }
        }

    fun removeStateTransition(projectName: String, previousState: String, nextState: String) =
        jdbi.useHandle<Exception> { handle ->
            handle.createUpdate("delete from states_transitions where previous_state_name = :previousState and " +
                    "next_state_name = :nextState and project_name = :projectName")
                .bind("previousState", previousState)
                .bind("nextState", nextState)
                .bind("projectName", projectName)
                .execute()
        }
}

class UnableToAddTransitionException(s: String) : Exception(s)
class UnableToRemoveTransitionException(s: String) : Exception(s)

class ProjectAlreadyExistsException(s: String) : Exception(s)