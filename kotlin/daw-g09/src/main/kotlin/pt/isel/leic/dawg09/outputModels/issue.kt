package pt.isel.leic.dawg09.outputModels

import com.fasterxml.jackson.annotation.JsonInclude
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import pt.isel.leic.dawg09.dto.*
import pt.isel.leic.dawg09.project.PROJECTS_LINK
import pt.isel.leic.dawg09.project.SimpleLink
import pt.isel.leic.dawg09.project.selfLink
import pt.isel.leic.dawg09.project.toSirenObject
import pt.isel.leic.dawg09.utils.ISSUES_PATH
import pt.isel.leic.dawg09.utils.ISSUES_PATH_TEMPLATE
import pt.isel.leic.dawg09.utils.PROJECTS_PATH
import java.net.URI

@JsonInclude(JsonInclude.Include.NON_NULL)
data class IssueOutputModel (
    val id :                Long ,
    val name :              String ,
    val project_name :      String,
    val description :       String,
    val creation_date :     String,
    val close_date :        String?,
    val from_username :     String,
    val state_name :        String,
    val labels :            List<String> = emptyList(),
)

fun IssueOutputModel.path() = "/$PROJECTS_PATH/${encode(this.project_name)}/$ISSUES_PATH/${this.id}"

data class IssueListOutputModel (
    val page : PaginationProperties,
    val projectName: String,
    val list : List<IssueOutputModel>
)

fun IssueListOutputModel.path() = "/$PROJECTS_PATH/${encode(this.projectName)}/$ISSUES_PATH"

fun IssueListOutputModel.toSirenObject() = SirenEntity(
    properties = this.page,
    entities = this.list.map{ it.toSubEntity() },
    clazz = listOf("Issue", "Collection"),
    links = listOfNotNull(
        if(this.page.currentPage > 1)
            SimpleLink("previous","${this.path()}?page=${this.page.currentPage-1}&size=${this.page.pageSize}") else null,

        SimpleLink("self","${this.path()}?page=${this.page.currentPage}&size=${this.page.pageSize}"),

        if(this.page.currentPage*this.page.pageSize < this.page.collectionSize)
            SimpleLink("next","${this.path()}?page=${this.page.currentPage+1}&size=${this.page.pageSize}") else null
    ),
    actions = listOf(CREATE_ISSUE_ACTION)
)

val CREATE_ISSUE_ACTION = SirenAction(
    name = "create-issue",
    title = "Create Issue",
    href = URI(ISSUES_PATH),
    method = HttpMethod.POST,
    type = MediaType.APPLICATION_JSON_VALUE,
    fields = listOf(
        SirenAction.Field("name", "text"),
        SirenAction.Field("description", "text"),
        SirenAction.Field("allowedLabels", "Array"),
    )
)

fun IssueOutputModel.toSubEntity() = EmbeddedEntity(rel = listOf("Issue"),
    clazz = listOf("Issue"),
    properties = this,
    links = listOf(
        SimpleLink("self", this.path())
    )
)

fun IssueOutputModel.toSirenObject() = SirenEntity(
    properties = this,
    clazz = listOf("Issue"),
    links = listOf( selfLink("/$PROJECTS_PATH/${encode(this.project_name)}/$ISSUES_PATH/${this.id}"),
                    SimpleLink("Comments","/$PROJECTS_PATH/${encode(this.project_name)}/$ISSUES_PATH/${this.id}/comments")),

    actions = listOf(
        SirenAction(
            name = "delete-issue",
            title = "Delete Issue",
            href = URI("/$PROJECTS_PATH/${encode(this.project_name)}/$ISSUES_PATH/${this.id}"),
            method = HttpMethod.DELETE,
            type = MediaType.APPLICATION_JSON_VALUE,
        ),
        SirenAction(
            name = "patch-issue",
            title = "Patch Issue",
            href = URI("$PROJECTS_PATH/${encode(this.project_name)}/$ISSUES_PATH/${this.id}"),
            method = HttpMethod.PATCH,
            type = "application/json-patch+json"
        )
    )
)




