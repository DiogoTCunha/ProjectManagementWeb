package pt.isel.leic.dawg09

import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.kotlin.withHandleUnchecked
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest

data class Project(
		val name: String,
		val description: String,
		val initial_state_name: String
)

@SpringBootTest
class DbTests {

}