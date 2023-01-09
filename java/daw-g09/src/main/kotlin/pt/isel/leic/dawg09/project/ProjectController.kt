package pt.isel.leic.dawg09.project

import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import pt.isel.leic.dawg09.authentication.ProtectedResource
import pt.isel.leic.dawg09.authentication.USER_ATTRIBUTE_KEY
import pt.isel.leic.dawg09.authentication.UserInfo
import pt.isel.leic.dawg09.dto.*
import pt.isel.leic.dawg09.utils.PROJECTS_PATH
import java.lang.IllegalStateException
import java.net.URI
import java.net.URLDecoder
import java.net.URLEncoder
import javax.servlet.http.HttpServletRequest

@RestController
@RequestMapping(PROJECTS_PATH, produces = [SIREN_MEDIA_TYPE, MediaType.APPLICATION_JSON_VALUE])
class ProjectController(val projectService: ProjectService) {

    @GetMapping
    fun getProjects(
        req: HttpServletRequest,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") limit: Int
    ): SirenEntity<PaginationProperties> {
        val actualPage = if(page < 0) 0 else page

        return projectService.getProjects(actualPage, limit).toSirenObject()
    }

    @ProtectedResource
    @PostMapping
    fun createProject(req: HttpServletRequest, @RequestBody project: ProjectInputModel) {
        val user = req.getAttribute(USER_ATTRIBUTE_KEY) as UserInfo

        projectService.createProject(user, project)
    }

    @GetMapping("/{projectName}")
    fun getProject(req: HttpServletRequest, @PathVariable projectName: String) =
        projectService.getProject(URLDecoder.decode(projectName)).toSirenObject()

    @ProtectedResource
    @DeleteMapping("/{projectName}")
    fun deleteProject(req: HttpServletRequest, @PathVariable projectName: String) {
        val user = req.getAttribute(USER_ATTRIBUTE_KEY) as UserInfo
        val projectNameDecoded = URLDecoder.decode(projectName)
        val project = projectService.getProject(projectNameDecoded)

        if (user.name != project.projectOwner) throw UserNotOwner("You do not have privilege to $projectName!")

        projectService.deleteProject(projectNameDecoded)
    }

    @ProtectedResource
    @PatchMapping("/{projectName}")
    fun patchProject(
        req: HttpServletRequest,
        @RequestBody updates: List<Operation>,
        @PathVariable projectName: String
    ) {
        val user = req.getAttribute(USER_ATTRIBUTE_KEY) as UserInfo
        val projectNameDecoded = URLDecoder.decode(projectName)
        val project = projectService.getProject(projectNameDecoded)
        if (user.name != project.projectOwner) throw UserNotOwner("You do not have privilege to this project!")

        //Only allow for add and remove
        for (operation in updates) {
            if (operation.op == "add" && operation.path == "label")
                projectService.addLabel(
                    projectName,
                    operation.value as String
                )

            if (operation.op == "remove" && operation.path == "label")
                projectService.removeLabel(
                    projectName,
                    operation.value as String
                )

            if (operation.op == "add" && operation.path == "state")
                projectService.addState(
                    projectName,
                    operation.value as String
                )

            if (operation.op == "remove" && operation.path == "state") {
                if(operation.value == project.initialState)
                    throw RemoveStateException("Can't remove initial state of project")

                projectService.removeState(
                    projectName,
                    operation.value as String
                )
            }

            if(operation.op == "add" && operation.path == "stateTransition") {
                if(!operation.value.toString().contains("->"))
                    throw UnableToAddTransitionException("Value syntax error, must be : previous_state->nextState")

                val (previousState, nextState) = operation.value.toString().split("->")
                projectService.addStateTransition(projectName, previousState, nextState)
            }

            if(operation.op == "remove" && operation.path == "stateTransition") {
                if(!operation.value.toString().contains("->"))
                    throw UnableToAddTransitionException("Value syntax error, must be : previous_state->nextState")
                val (previousState, nextState) = operation.value.toString().split("->")
                projectService.removeStateTransition(projectName, previousState, nextState)
            }
        }
    }

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
    fun handleUserNotOwnerException(ex : Exception ) = ResponseEntity
        .status(400)
        .contentType(ProblemJsonModel.MEDIA_TYPE)
        .body(
            ProblemJsonModel(
                detail = ex.message,
                type = URI("/probs/resource-not-found")
            )
        )

    @ExceptionHandler(ProjectAlreadyExistsException::class)
    fun handleFoundNoneException(ex : Exception) = ResponseEntity
        .status(400)
        .contentType(ProblemJsonModel.MEDIA_TYPE)
        .body(
            ProblemJsonModel(
                detail = ex.message,
                type = URI("/probs/resource-already-exists")
            )
        )

    @ExceptionHandler(RemoveStateException::class)
    fun handleRemoveStateException(ex : Exception) = ResponseEntity
        .status(400)
        .contentType(ProblemJsonModel.MEDIA_TYPE)
        .body(
            ProblemJsonModel(
                detail = ex.message,
                type = URI("/probs/resource-already-exists")
            )
        )

    @ExceptionHandler(UnableToAddTransitionException::class)
    fun handleAddTransitionsException(ex : Exception) = ResponseEntity
        .status(400)
        .contentType(ProblemJsonModel.MEDIA_TYPE)
        .body(
            ProblemJsonModel(
                detail = ex.message,
                type = URI("/probs/transition-problems")
            )
        )

    @ExceptionHandler(UnableToRemoveTransitionException::class)
    fun handleRemoveTransitionsException(ex : Exception) = ResponseEntity
        .status(400)
        .contentType(ProblemJsonModel.MEDIA_TYPE)
        .body(
            ProblemJsonModel(
                detail = ex.message,
                type = URI("/probs/transition-problems")
            )
        )

}

class RemoveStateException(s: String) : Exception(s)
