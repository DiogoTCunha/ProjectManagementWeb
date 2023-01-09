package pt.isel.leic.dawg09.project

import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import pt.isel.leic.dawg09.dto.*
import pt.isel.leic.dawg09.outputModels.ProjectOutputModel
import pt.isel.leic.dawg09.utils.ISSUES_PATH
import pt.isel.leic.dawg09.utils.PROJECTS_PATH
import java.net.URI

class ProjectNotFoundException(s: String) : Exception(s)
class UserNotOwner(s: String) : Exception(s)

class Operation(
    val op: String,
    val path: String,
    val value: Any
)

class State(
    val newState: String,
    val transitions: Array<StateTransition>
)

class StateTransition(
    val previousState: String,
    val nextState: String
)

/**
 * Represents the values that are needed to create a project
 *
 * @property    name            The name of the project
 * @property    description     The description of the project
 * @property    initialState    The initial state of any issue created for this project
 * @property    allowedLabels   All labels that are allowed to be referenced by a project
 */
class ProjectInputModel(
    val name: String,
    val description: String,
    val initialState: String,
    val allowedLabels: List<String>
)

val PROJECTS_LINK = SirenLink(rel = listOf("Projects"), href = URI(PROJECTS_PATH))

val CREATE_PROJECT_ACTION = SirenAction(
    name = "create-project",
    title = "Create Project",
    href = URI(PROJECTS_PATH),
    method = HttpMethod.POST,
    type = MediaType.APPLICATION_JSON_VALUE,
    fields = listOf(
        SirenAction.Field("name", "text"),
        SirenAction.Field("description", "text"),
        SirenAction.Field("initialState", "text"),
        SirenAction.Field("allowedLabels", "Array"),
    )
)

/**
 * Gets a Siren self link for the given URI
 *
 * @param uri   the string with the self URI
 * @return the resulting Ssiren link
 */
fun selfLink(uri: String) = SirenLink(rel = listOf("self"), href = URI(uri)) //TODO: Move this function out of here

fun SimpleLink(rel: String, uri: String) = SirenLink(rel = listOf(rel), href = URI(uri))


/**
 * Extension method which produces a Siren resource for representation
 *
 * @return Siren representation
 */
fun ProjectOutputModel.toSirenObject() = SirenEntity(  //TODO: Maybe add a _shouldIncludeActions_
    properties = this,
    clazz = listOf("Project"),
    links = listOf( selfLink("$PROJECTS_PATH/${encode(name)}"),
                    PROJECTS_LINK,
                    SimpleLink("Issues", "$PROJECTS_PATH/${encode(name)}/$ISSUES_PATH")),
    actions = listOf(
        SirenAction(
            name = "delete-project",
            title = "Delete Project",
            href = URI("$PROJECTS_PATH/${encode(name)}"),
            method = HttpMethod.DELETE,
            type = MediaType.APPLICATION_JSON_VALUE,
        ),
        SirenAction(
            name = "patch-project",
            title = "Patch Project",
            href = URI("$PROJECTS_PATH/${encode(name)}"),
            method = HttpMethod.PATCH,
            type = "application/json-patch+json"
        )
    )
)

fun Pair<PaginationProperties, List<ProjectOutputModel>>.toSirenObject() = SirenEntity(
    properties = this.first,
    entities = this.second.map { project ->
        EmbeddedEntity(
            rel = listOf("project"),
            clazz = listOf("project"),
            properties = project,
            links = listOf(
                SirenLink(
                    rel = listOf("self"),
                    href = URI("$PROJECTS_PATH/${encode(project.name)}")
                )
            )
        )
    },
    clazz = listOf("Project", "Collection"),
    links = listOfNotNull(selfLink("$PROJECTS_PATH?page=${this.first.currentPage}"),
                if(this.first.pageSize*(this.first.currentPage+1)<=this.first.collectionSize)
                    SimpleLink("next page","$PROJECTS_PATH?page=${this.first.currentPage+1}") else null,
                if(this.first.currentPage>0)
                    SimpleLink("previous page","$PROJECTS_PATH?page=${this.first.currentPage+1}") else null),
    actions = listOf(CREATE_PROJECT_ACTION)
)