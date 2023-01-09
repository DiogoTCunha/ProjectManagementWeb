package pt.isel.leic.dawg09

import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.kotlin.KotlinPlugin
import org.postgresql.ds.PGSimpleDataSource
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.context.properties.ConstructorBinding
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.EnableWebMvc
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import pt.isel.leic.dawg09.authentication.AccessControlInterceptor
import javax.sql.DataSource

@ConstructorBinding
@ConfigurationProperties("app")
data class ConfigProperties (
	val dbConnString: String,
	val host: String
)

@Configuration
@EnableWebMvc
class ApiConfig : WebMvcConfigurer {
	override fun addInterceptors(registry: InterceptorRegistry) {
		registry.addInterceptor(AccessControlInterceptor())
	}
}

@SpringBootApplication
@ConfigurationPropertiesScan
class DawG09Application {
	@Bean
	fun dataSource(configProperties: ConfigProperties): DataSource {
		return PGSimpleDataSource().apply {
			setURL(configProperties.dbConnString)
		}
	}

	@Bean
	fun jdbi(dataSource: DataSource): Jdbi = Jdbi.create(dataSource).apply {
		installPlugin(KotlinPlugin())
	}
}

fun main(args: Array<String>) {
	runApplication<DawG09Application>(*args)
}
