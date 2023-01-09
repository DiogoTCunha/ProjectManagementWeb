package pt.isel.leic.dawg09.exceptionHandler

import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.HttpMediaTypeNotAcceptableException
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.method.HandlerMethod
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler
import pt.isel.leic.dawg09.dto.ProblemJsonModel
import java.net.URI
import java.sql.SQLException
import javax.servlet.http.HttpServletResponse


const val BASIC_SCHEME = "Basic"
const val CHALLENGE_HEADER = "WWW-Authenticate"

@ControllerAdvice
class ExceptionHandler : ResponseEntityExceptionHandler() {

}

@ResponseStatus(HttpStatus.UNAUTHORIZED)
class UnauthorizedException : Exception()

@ResponseStatus(HttpStatus.FORBIDDEN)
class UserHasNoPermissionException : Exception()
