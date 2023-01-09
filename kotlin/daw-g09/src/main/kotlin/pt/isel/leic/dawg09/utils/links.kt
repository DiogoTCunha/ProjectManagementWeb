package pt.isel.leic.dawg09.utils

const val PROJECTS_PATH             = "projects"
const val ISSUES_PATH               = "issues"
const val LABELS_PATH               = "labels"
const val COMMENTS_PATH             = "comments"
const val ISSUES_PATH_TEMPLATE      = "$PROJECTS_PATH/{projectName}/${ISSUES_PATH}"
const val COMMENTS_PATH_TEMPLATE    = "$PROJECTS_PATH/{projectName}/${ISSUES_PATH}/{issueId}/${COMMENTS_PATH}"
