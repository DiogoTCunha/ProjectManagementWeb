package pt.isel.leic.dawg09.comments

import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import pt.isel.leic.dawg09.authentication.ProtectedResource
import pt.isel.leic.dawg09.authentication.USER_ATTRIBUTE_KEY
import pt.isel.leic.dawg09.authentication.UserInfo
import pt.isel.leic.dawg09.dto.PaginationProperties
import pt.isel.leic.dawg09.dto.ProblemJsonModel
import pt.isel.leic.dawg09.dto.SIREN_MEDIA_TYPE
import pt.isel.leic.dawg09.dto.SirenEntity
import pt.isel.leic.dawg09.issues.IssueArchivedException
import pt.isel.leic.dawg09.issues.IssuesService
import pt.isel.leic.dawg09.outputModels.CommentInputModel
import pt.isel.leic.dawg09.outputModels.CommentOutputModel
import pt.isel.leic.dawg09.outputModels.IssueOutputModel
import pt.isel.leic.dawg09.outputModels.toSirenObject
import pt.isel.leic.dawg09.utils.COMMENTS_PATH
import pt.isel.leic.dawg09.utils.COMMENTS_PATH_TEMPLATE
import pt.isel.leic.dawg09.utils.ISSUES_PATH
import pt.isel.leic.dawg09.utils.PROJECTS_PATH

import java.lang.IllegalStateException
import java.net.URI
import javax.servlet.http.HttpServletRequest

@RestController
@RequestMapping(COMMENTS_PATH_TEMPLATE, produces = [SIREN_MEDIA_TYPE, MediaType.APPLICATION_JSON_VALUE])
class CommentsController(val commentsService: CommentsService, val issuesService: IssuesService) {

    @ExceptionHandler(IllegalStateException::class)
    fun handleFoundNoneException() = ResponseEntity
        .status(404)
        .contentType(ProblemJsonModel.MEDIA_TYPE)
        .body(
            ProblemJsonModel(
                detail = "This resource does not exist.",
                type = URI("/probs/resource-not-found")
            )
        )

    @ExceptionHandler(UserNotOwner::class)
    fun handleUserNotOwnerException() = ResponseEntity
        .status(403)
        .contentType(ProblemJsonModel.MEDIA_TYPE)
        .body(
            ProblemJsonModel(
                detail = "You do not have access to this resource.",
                type = URI("/probs/no-privileges-to-resource")
            )
        )

    @GetMapping
    fun getCommentsFromIssue(
        req: HttpServletRequest,
        @PathVariable projectName: String,
        @PathVariable issueId: Int,
        @RequestParam(name = "page", defaultValue = "0") pageNumber: Int,
        @RequestParam(name = "size", defaultValue = "10") pageSize: Int,
    ): SirenEntity<PaginationProperties> {
        return commentsService.getCommentsFromIssue(
            pageNumber,
            pageSize,
            issueId
        ).toSirenObject(projectName)
    }

    @ProtectedResource
    @PostMapping
    fun postCommentToIssue(req: HttpServletRequest,
                           @PathVariable projectName: String,
                           @PathVariable issueId: Int,
                           @RequestBody comment: CommentInputModel)
     :ResponseEntity<CommentOutputModel>
    {
        println("Creating Comment")
        println(comment)
        val user = req.getAttribute(USER_ATTRIBUTE_KEY) as UserInfo
        if (issuesService.getIssue(projectName,issueId).state_name == "archived")
            throw IssueArchivedException("Issue $issueId is archived")
        commentsService.addComment(user, issueId, comment.text)
        val returnedId = 3
        return ResponseEntity.created(URI("$PROJECTS_PATH/$projectName/$ISSUES_PATH/${issueId}/comments/${returnedId}")).build()
    }

    @ProtectedResource
    @DeleteMapping("/{commentId}")
    fun deleteComment(req: HttpServletRequest, @PathVariable commentId: Int): ResponseEntity<String> {
        val user = req.getAttribute(USER_ATTRIBUTE_KEY) as UserInfo


        if (!commentsService.isOwnerOfComment(user, commentId))
            throw UserNotOwner("You do not have privilege to this comment!")
        commentsService.removeComment(commentId)
        return ResponseEntity.ok("Comment with id ${commentId} deleted");
    }

    @ExceptionHandler(IssueArchivedException::class)
    fun handleArchivedException(ex: IssueArchivedException) = ResponseEntity
        .status(400)
        .contentType(ProblemJsonModel.MEDIA_TYPE)
        .body(
            ProblemJsonModel(
                detail = ex.message,
                type = URI("/probs/bad-request")
            )
        )
}


