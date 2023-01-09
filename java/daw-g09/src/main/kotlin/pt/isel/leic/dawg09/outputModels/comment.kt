package pt.isel.leic.dawg09.outputModels

import com.fasterxml.jackson.annotation.JsonInclude
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import pt.isel.leic.dawg09.dto.EmbeddedEntity
import pt.isel.leic.dawg09.dto.PaginationProperties
import pt.isel.leic.dawg09.dto.SirenAction
import pt.isel.leic.dawg09.dto.SirenEntity
import pt.isel.leic.dawg09.project.SimpleLink
import pt.isel.leic.dawg09.project.selfLink
import pt.isel.leic.dawg09.utils.COMMENTS_PATH
import pt.isel.leic.dawg09.utils.ISSUES_PATH
import pt.isel.leic.dawg09.utils.PROJECTS_PATH
import java.net.URI

data class CommentInputModel (val text : String)

@JsonInclude(JsonInclude.Include.NON_NULL)
data class CommentOutputModel (
    val id :                Long ,
    val date :              String,
    val from_username :     String,
    val text :              String,
    val issue_id :          Long,
)

fun CommentOutputModel.path(project_name: String) = "/$PROJECTS_PATH/${project_name}/$ISSUES_PATH/${this.issue_id}/comments/${this.id}"

data class CommentListOutputModel (
    val page : PaginationProperties,
    val issue_id: Int,
    val list : List<CommentOutputModel>
)

fun CommentListOutputModel.path(project_name: String) = "/$PROJECTS_PATH/${project_name}/$ISSUES_PATH/${this.issue_id}/comments"

fun CommentListOutputModel.toSirenObject(project_name: String) = SirenEntity(
    properties = this.page,
    entities = this.list.map{ it.toSubEntity(project_name) },
    clazz = listOf("Comment", "Collection"),
    links = listOfNotNull(
        if(this.page.currentPage > 1)
            SimpleLink("previous","${this.path(project_name)}?page=${this.page.currentPage-1}&size=${this.page.pageSize}") else null,

        SimpleLink("self","${this.path(project_name)}?page=${this.page.currentPage}&size=${this.page.pageSize}"),

        if(this.page.currentPage*this.page.pageSize < this.page.collectionSize)
            SimpleLink("next","${this.path(project_name)}?page=${this.page.currentPage+1}&size=${this.page.pageSize}") else null
    ),
    actions = listOf(ADD_COMMENT_ACTION)
)

val ADD_COMMENT_ACTION = SirenAction(
    name = "add-comment",
    title = "Add Comment",
    href = URI(COMMENTS_PATH),
    method = HttpMethod.POST,
    type = MediaType.APPLICATION_JSON_VALUE,
    fields = listOf(
        SirenAction.Field("text", "text"),
    )
)

fun CommentOutputModel.toSubEntity(project_name: String) = EmbeddedEntity(rel = listOf("Comment"),
    clazz = listOf("Comment"),
    properties = this,
    links = listOf(
        SimpleLink("self", this.path(project_name))
    )
)


fun CommentOutputModel.toSirenObject(project_name: String) = SirenEntity(
    properties = this,
    clazz = listOf("Comment"),
    links = listOf( selfLink("/$PROJECTS_PATH/${project_name}/$ISSUES_PATH/${this.issue_id}/comments/${this.id}")),
    actions = listOf(
        SirenAction(
            name = "delete-comment",
            title = "Delete Comment",
            href = URI("/$PROJECTS_PATH/${project_name}/$ISSUES_PATH/${this.issue_id}/comments/${this.id}"),
            method = HttpMethod.DELETE,
            type = MediaType.APPLICATION_JSON_VALUE,
        )
    )
)


