package pt.isel.leic.dawg09.authentication

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component
import org.springframework.util.Base64Utils
import pt.isel.leic.dawg09.db.DBAccess
import javax.servlet.Filter
import javax.servlet.FilterChain
import javax.servlet.ServletRequest
import javax.servlet.ServletResponse
import javax.servlet.http.HttpServletRequest

data class UserInfo(val name: String)

const val USER_ATTRIBUTE_KEY = "user-attribute"
const val BASIC_SCHEME = "Basic"

@Component
class AuthenticationFilter(var dba: DBAccess) : Filter {

    override fun doFilter(request: ServletRequest?, response: ServletResponse?, chain: FilterChain?) {

        val httpRequest = request as HttpServletRequest
        val authorizationHeader = httpRequest.getHeader("authorization") ?: ""

        val userInfo = verifyUserCredentials(authorizationHeader)
        if(userInfo != null) {
            httpRequest.setAttribute(USER_ATTRIBUTE_KEY, userInfo)
        }
        chain?.doFilter(request, response)

    }

    fun verifyUserCredentials(response: String): UserInfo? {
        var trimmedResponse = response.trim()
        if(trimmedResponse.startsWith(BASIC_SCHEME, ignoreCase = true)) {
            trimmedResponse = trimmedResponse.drop(BASIC_SCHEME.length + 1).trim()
            val (userId, pwd) = String(Base64Utils.decodeFromString(trimmedResponse)).split(':')

            return when {
                dba.validateUser(userId,pwd) -> UserInfo(userId)
                else -> null
            }
        }
        return null
    }


}