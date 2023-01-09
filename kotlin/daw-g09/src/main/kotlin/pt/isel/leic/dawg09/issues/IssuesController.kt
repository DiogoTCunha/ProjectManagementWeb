package pt.isel.leic.dawg09.issues

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
import pt.isel.leic.dawg09.outputModels.IssueOutputModel
import pt.isel.leic.dawg09.outputModels.toSirenObject
import pt.isel.leic.dawg09.project.Operation
import pt.isel.leic.dawg09.project.ProjectNotFoundException
import pt.isel.leic.dawg09.project.UserNotOwner
import pt.isel.leic.dawg09.utils.ISSUES_PATH
import pt.isel.leic.dawg09.utils.ISSUES_PATH_TEMPLATE
import pt.isel.leic.dawg09.utils.PROJECTS_PATH
import java.lang.IllegalStateException
import java.net.URI
import java.net.URLDecoder
import java.net.URLEncoder
import javax.servlet.http.HttpServletRequest


@RestController
@RequestMapping(ISSUES_PATH_TEMPLATE, produces = [SIREN_MEDIA_TYPE, MediaType.APPLICATION_JSON_VALUE])
class IssuesController(val issuesService: IssuesService) {

    @GetMapping
    fun getIssues(
        @PathVariable projectName: String,
        @RequestParam(name = "page", defaultValue = "1") pageNumber: Int,
        @RequestParam(name = "size", defaultValue = "10") pageSize: Int
    )
            : SirenEntity<PaginationProperties> {
        val projectNameDecoded = URLDecoder.decode(projectName)
        return issuesService.getIssues(projectNameDecoded, pageNumber, pageSize).toSirenObject()
    }


    @GetMapping("/{issueId}")
    fun getIssue(@PathVariable projectName: String, @PathVariable issueId: Int): SirenEntity<IssueOutputModel> {
        val projectNameDecoded = URLDecoder.decode(projectName)
        return issuesService.getIssue(projectNameDecoded, issueId).toSirenObject()
    }

    @ProtectedResource
    @PostMapping
    fun CreateIssue(
        req: HttpServletRequest,
        @PathVariable projectName: String,
        @RequestBody issue: IssueInputModel
    ): ResponseEntity<IssueOutputModel> {
        val user = req.getAttribute(USER_ATTRIBUTE_KEY) as UserInfo
        val projectNameDecoded = URLDecoder.decode(projectName)
        val issueToReturn = issuesService.createIssue(projectNameDecoded, issue, user.name)
        val projectNameEncoded = URLEncoder.encode(projectName)
        return ResponseEntity.created(URI("${PROJECTS_PATH}/$projectNameEncoded/${ISSUES_PATH}/${issueToReturn.id}"))
            .build()
    }

    @ProtectedResource
    @PatchMapping("/{issueId}")
    fun EditIssue(
        req: HttpServletRequest, @PathVariable projectName: String, @PathVariable issueId: Int,
        @RequestBody updates: List<Operation>
    ) {
        val user = req.getAttribute(USER_ATTRIBUTE_KEY) as UserInfo
        val projectNameDecoded = URLDecoder.decode(projectName)
        val issue = issuesService.getIssue(projectNameDecoded, issueId)
        if (issue.from_username != user.name) throw IssueNotOwnedByUser("User doesn't own this issue")

        //Only allow for add and remove
        for (operation in updates) {
            println("${operation.op}/${operation.path}/${operation.value}")
            if (operation.op == "add" && operation.path == "label")

                issuesService.addLabel(
                    issueId,
                    projectName,
                    operation.value as String
                )

            if (operation.op == "remove" && operation.path == "label")
                issuesService.removeLabel(
                    issueId,
                    projectName,
                    operation.value as String
                )

            if (operation.op == "replace" && operation.path == "state")
                issuesService.changeState(
                    issueId,
                    projectName,
                    operation.value as String
                )
        }
    }

    @ProtectedResource
    @DeleteMapping("/{issueId}")
    fun DeleteIssue(req: HttpServletRequest, @PathVariable projectName: String, @PathVariable issueId: Int) {
        val user = req.getAttribute(USER_ATTRIBUTE_KEY) as UserInfo
        val projectNameDecoded = URLDecoder.decode(projectName)
        val issue = issuesService.getIssue(projectNameDecoded, issueId)
        if (issue.from_username != user.name) throw IssueNotOwnedByUser("User doesn't own this issue")

        issuesService.deleteIssue(issueId)
    }


    @ExceptionHandler(IssuesService.IssueNotFoundException::class)
    fun handleFoundNoIssueException(ex: IssuesService.IssueNotFoundException) = ResponseEntity
        .status(404)
        .contentType(ProblemJsonModel.MEDIA_TYPE)
        .body(
            ProblemJsonModel(
                detail = ex.message,
                type = URI("/probs/resource-not-found")
            )
        )

    class IssueNotOwnedByUser(s: String) : Exception(s)

    @ExceptionHandler(IssueNotOwnedByUser::class)
    fun handleIssueNotOwnedException(ex: IssueNotOwnedByUser) = ResponseEntity
        .status(403)
        .contentType(ProblemJsonModel.MEDIA_TYPE)
        .body(
            ProblemJsonModel(
                detail = ex.message,
                type = URI("/probs/resource-not-found")
            )
        )


    @ExceptionHandler(ProjectNotFoundException::class)
    fun handleFoundNoneException(ex: ProjectNotFoundException) = ResponseEntity
        .status(404)
        .contentType(ProblemJsonModel.MEDIA_TYPE)
        .body(
            ProblemJsonModel(
                detail = ex.message,
                type = URI("/probs/resource-not-found")
            )
        )

    @ExceptionHandler(IssuesService.TransitionNotPossibleException::class)
    fun handleTransitionException(ex: IssuesService.TransitionNotPossibleException) = ResponseEntity
        .status(400)
        .contentType(ProblemJsonModel.MEDIA_TYPE)
        .body(
            ProblemJsonModel(
                detail = ex.message,
                type = URI("/probs/resource-not-found")
            )
        )

}


