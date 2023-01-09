package pt.isel.leic.dawg09.dto

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.web.util.UriTemplate
import java.net.URI
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

data class PaginationProperties(
        val currentPage: Int,
        val pageSize: Int,
        val collectionSize: Int,
)

fun encode(s: String): String = URLEncoder.encode(s, StandardCharsets.UTF_8.toString())

const val APPLICATION_TYPE = "application"
const val SIREN_SUBTYPE = "vnd.siren+json"
const val SIREN_MEDIA_TYPE = "${APPLICATION_TYPE}/${SIREN_SUBTYPE}"

@JsonInclude(JsonInclude.Include.NON_NULL)
data class SirenEntity<T>(
        @JsonProperty("class") val clazz: List<String>? = null,
        val properties: T? =null,
        val entities: List<SubEntity>? = null,
        val actions: List<SirenAction>? = null,
        val title: String? = null,
        val links: List<SirenLink>? = null,
)



@JsonInclude(JsonInclude.Include.NON_NULL)
sealed class SubEntity
@JsonInclude(JsonInclude.Include.NON_NULL)
data class EmbeddedLink(
        @JsonProperty("class")
        val clazz: List<String>? = null,
        val rel: List<String>,
        val href: URI,
        @JsonSerialize(using = ToStringSerializer::class)
        val type: MediaType? = null,
        val title: String? = null
) : SubEntity()

@JsonInclude(JsonInclude.Include.NON_NULL)
data class EmbeddedEntity<T>(
        val rel: List<String>,
        @JsonProperty("class") val clazz: List<String>? = null,
        val properties: T? = null,
        val entities: List<SubEntity>? = null,
        val links: List<SirenLink>? = null,
        val actions: SirenAction? = null,
        val title: String? = null
) : SubEntity()

@JsonInclude(JsonInclude.Include.NON_NULL)
data class SirenLink(
        val rel: List<String>,
        val href: URI? = null,
        val hrefTemplate: String? = null,
        val title: String? = null,
        val type: MediaType? = null)

/**
 * Class whose instances represent actions that are included in a siren entity.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class SirenAction(
        val name: String,
        val href: URI? = null,
        val hrefTemplate: String? = null,
        val title: String? = null,
        @JsonProperty("class")
        val clazz: List<String>? = null,
        val method: HttpMethod? = null,
        @JsonSerialize(using = ToStringSerializer::class)
        val type: String? = null,
        val fields: List<Field>? = null
) {
    /**
     * Represents action's fields
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    data class Field(
            val name: String,
            val type: String? = null,
            val value: String? = null,
            val title: String? = null
    )
}

