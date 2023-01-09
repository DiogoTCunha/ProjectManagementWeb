
create or replace procedure createProject (project_name varchar(50), description varchar(100), initial_state varchar(50), owner_username varchar(20))
LANGUAGE PLPGSQL
as $$
    
BEGIN
    IF initial_state = 'closed' OR initial_state = 'archived' THEN
        raise notice 'Initial State can not be closed or archived';
        return;
    END IF;

    INSERT INTO PROJECT(name, description,owner_username) VALUES (project_name, description,owner_username);
    INSERT INTO ALLOWED_STATES (name, project_name) VALUES (initial_state, project_name);
    UPDATE PROJECT SET initial_state_name = initial_state WHERE name = project_name;
    
		INSERT INTO COLLABORATOR VALUES ( owner_username, project_name);
  	INSERT INTO ALLOWED_STATES(name, project_name) VALUES('closed', project_name);  
	INSERT INTO ALLOWED_STATES(name, project_name) VALUES('archived', project_name);  
	INSERT INTO STATES_TRANSITIONS VALUES('closed', 'archived', project_name);
END;$$;

create or replace procedure insertLabels
    (project_name varchar(50), VARIADIC labels text[])
LANGUAGE PLPGSQL
as $$
DECLARE
    label text;
BEGIN
    foreach label in ARRAY labels loop
        INSERT INTO ALLOWED_LABELS(name, project_name) VALUES (label, project_name);
    end loop;
END; $$;

create or replace procedure createIssue
    (issue_name varchar(50), description varchar(100), curr_project_name varchar(50),from_username varchar(20), VARIADIC label_names text[])
LANGUAGE PLPGSQL
as $$

DECLARE
    issue_id integer;
	label_name varchar(50);
BEGIN

    INSERT INTO ISSUE(name, description, creation_date, state_name, project_name,from_username)
    VALUES(
        issue_name,
        description,
        current_timestamp,
        (SELECT initial_state_name FROM PROJECT WHERE name = curr_project_name),
		curr_project_name,
		from_username
	) RETURNING id INTO issue_id;

    foreach label_name in ARRAY label_names loop
        IF (SELECT COUNT(name) FROM ALLOWED_LABELS WHERE name = label_name AND project_name = curr_project_name) <= 0 THEN
            raise notice 'Label % not allowed on project %.', label_name, curr_project_name;
            ROLLBACK;
            RETURN;
        END IF;
        INSERT INTO LABEL(name, project_name, issue_id) VALUES (label_name, curr_project_name, issue_id);
    end loop;
END; $$;

create or replace procedure createIssue
    (name varchar(50), description varchar(100), project_name varchar(50), from_user varchar(20))
LANGUAGE PLPGSQL
as $$
BEGIN
    CALL createIssue(name, description, project_name,from_user, VARIADIC ARRAY[]::text[]);
END; $$;

create or replace procedure addComment(issue_id integer, comment varchar(250), from_username varchar(20))
LANGUAGE PLPGSQL
as $$
DECLARE
    curr_project_name varchar(50);
BEGIN
    SELECT project_name INTO curr_project_name FROM ISSUE where id = issue_id;
    
    IF ((SELECT state_name FROM ISSUE WHERE id = issue_id  AND project_name = curr_project_name) = 'archived')  THEN
        raise notice 'Issue % from project % is archived.', issue_id, curr_project_name;
        ROLLBACK;
        RETURN;
    END IF;
    INSERT INTO COMMENT (date, text, issue_id,from_username) VALUES (current_timestamp, comment, issue_id,from_username);
END; $$;

create or replace function addCloseDate() RETURNS TRIGGER
LANGUAGE PLPGSQL
as $$
DECLARE 
curr_project_id integer;
curr_issue_id integer;
archived_id integer;
BEGIN
    SELECT project_id INTO curr_project_id FROM inserted;
    SELECT id INTO curr_issue_id FROM inserted;
    SELECT id INTO archived_id FROM ALLOWED_STATES WHERE name = 'archived' AND project_id = curr_project_id;
    IF ((SELECT state_id FROM inserted) = archived_id) THEN
            UPDATE ISSUE SET close_date = current_timestamp WHERE id = curr_issue_id;
    END IF;
    RETURN NULL;
END;$$;

create or replace function addCloseDate() RETURNS TRIGGER
LANGUAGE PLPGSQL
as $$
DECLARE 
curr_project_name varchar(50);
curr_issue_id integer;
BEGIN
    SELECT project_name INTO curr_project_name FROM inserted;
    SELECT id INTO curr_issue_id FROM inserted;
	
    IF ((SELECT state_name FROM inserted) = 'closed') THEN
            UPDATE ISSUE SET close_date = current_timestamp WHERE id = curr_issue_id;
    END IF;
    RETURN NULL;
END;$$;

CREATE OR REPLACE PROCEDURE public.changeissuestate(
	issue_id integer,
	new_state character varying)
LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
    curr_state_name varchar(50);
	curr_project_name varchar(50);
BEGIN
    SELECT state_name INTO curr_state_name FROM ISSUE where id = issue_id;
	SELECT project_name INTO curr_project_name FROM ISSUE where id = issue_id;
    
    IF NOT EXISTS (SELECT * FROM STATES_TRANSITIONS WHERE previous_state_name = curr_state_name 
		 AND project_name = curr_project_name AND next_state_name = new_state )  THEN
        RAISE 'State Transition not Allowed' USING ERRCODE = 23505;

        ROLLBACK;
        RETURN;
    END IF;
    UPDATE ISSUE SET state_name = new_state WHERE id = issue_id;
END;
$BODY$;

DROP TRIGGER IF EXISTS addClosedDate ON ISSUE;

create trigger addClosedDate AFTER UPDATE ON ISSUE
REFERENCING NEW TABLE AS inserted
FOR EACH ROW
WHEN (OLD.state_name IS DISTINCT FROM NEW.state_name)
EXECUTE PROCEDURE addCloseDate();

create or replace procedure deleteProject (projectName varchar(50))
LANGUAGE PLPGSQL
as $$
BEGIN
    DELETE FROM COLLABORATOR c
	WHERE c.project_name = projectName;
	
	DELETE FROM COMMENT c
	WHERE c.issue_id IN (SELECT id FROM ISSUE i WHERE i.project_name = projectName);
	
	DELETE FROM LABEL l
	WHERE l.project_name = projectName;
	
	DELETE FROM ISSUE i
	WHERE i.project_name = projectName;
	
	DELETE FROM ALLOWED_LABELS al
	WHERE al.project_name = projectName;
	
	DELETE FROM STATES_TRANSITIONS st
	WHERE st.project_name = projectName;
	
	UPDATE PROJECT SET initial_state_name = NULL WHERE name = projectName;
	
	DELETE FROM ALLOWED_STATES st
	WHERE st.project_name = projectName;
	
	DELETE FROM PROJECT p
	WHERE p.name = projectName;
	
END;$$;

create or replace procedure removeIssue (issueId int )
LANGUAGE PLPGSQL
as $$
BEGIN
	DELETE FROM label l
	where l.issue_id = issueId;
	
	DELETE FROM comment c
	where c.issue_id = issueId;
	
	DELETE FROM ISSUE i
	WHERE i.id = issueID;
	
END;$$;

CREATE OR REPLACE FUNCTION getProject(
 projectName varchar(50)
)
RETURNS TABLE (
        name varchar(50),
    description varchar(100),
    initialState varchar(50),
    projectOwner varchar(20),
    allowedLabels TEXT[],
    allowedStates TEXT[],
    stateTransitions TEXT[]
)
AS
$$
    SELECT
        name,
        description,
        initial_state_name as initialState,
        owner_username as groupOwner,
        (SELECT array_agg(name) FROM allowed_labels WHERE project_name = p.name) AS allowedLabels,
        (SELECT array_agg(name) FROM allowed_states WHERE project_name = p.name) AS allowedStates,
        (select array_agg(previous_state_name || '->' || next_state_name) FROM states_transitions WHERE project_name = p.name) AS stateTransitions
    FROM project p
    WHERE p.name = projectName
    ;
$$
LANGUAGE SQL
STABLE
;

CREATE OR REPLACE FUNCTION getIssue(
 issueId int
)
RETURNS TABLE (
    id int,
    name varchar(50),
    description varchar(100),
    creation_date timestamp,
    close_date timestamp,
    from_username varchar(20),
    state_name varchar(50),
	project_name varchar(50),
	labels TEXT[]
)
AS
$$
    SELECT id, name, description, creation_date,close_date , from_username, state_name , project_name,
        (SELECT array_agg(name) FROM label WHERE issue_id = issueId) AS labels
    FROM ISSUE i
    WHERE i.id = issueId
    ;
$$
LANGUAGE SQL
STABLE
;


