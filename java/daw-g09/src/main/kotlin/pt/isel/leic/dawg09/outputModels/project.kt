package pt.isel.leic.dawg09.outputModels

import com.fasterxml.jackson.annotation.JsonInclude

@JsonInclude(JsonInclude.Include.NON_NULL)
data class ProjectOutputModel(
        val name: String,
        val description: String,
        val initialState: String,
        val projectOwner: String,
        val allowedLabels: List<String> = emptyList(),
        val allowedStates: List<String> = emptyList(),
        val stateTransitions: List<String> = emptyList(),
)
