package pt.isel.leic.dawg09.issues

class IssueInputModel (
    val name: String,
    val description: String,
    val labels: List<String>?
)


class InvalidLabelForIssueException(s: String) : Exception(s)
class IssueArchivedException(s: String) : Exception(s)