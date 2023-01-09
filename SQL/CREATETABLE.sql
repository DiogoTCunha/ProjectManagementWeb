
BEGIN;
CREATE TABLE USERS (
	username varchar(20) PRIMARY KEY,
	password varchar(25)
);

CREATE TABLE PROJECT (
    name varchar(50) NOT NULL,
    description varchar(100) NOT NULL,
    initial_state_name varchar(50),
	owner_username varchar(20),
    PRIMARY KEY (name),
	FOREIGN KEY (owner_username) REFERENCES USERS(username)
);

CREATE TABLE COLLABORATOR(
		username varchar(20),
		project_name varchar(50),
		PRIMARY KEY (username,project_name),
		FOREIGN KEY (username) REFERENCES USERS(username),
		FOREIGN KEY (project_name) REFERENCES PROJECT(name)
);

CREATE TABLE ALLOWED_STATES (
    name varchar(50) NOT NULL,
    project_name varchar(50) NOT NULL,
    PRIMARY KEY (name, project_name),
    FOREIGN KEY (project_name) REFERENCES PROJECT(name)
);

ALTER TABLE PROJECT ADD CONSTRAINT state_checl FOREIGN KEY (initial_state_name, name) 
	REFERENCES ALLOWED_STATES(name, project_name);

CREATE TABLE ISSUE (
    id serial,
    name varchar(50) NOT NULL,
    description varchar(100) NOT NULL,
    creation_date timestamp NOT NULL DEFAULT NOW(),
    close_date timestamp,
		from_username varchar(20),
    state_name varchar(50) NOT NULL,
    project_name varchar(50) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (state_name, project_name) 
	REFERENCES ALLOWED_STATES(name, project_name),
    FOREIGN KEY (project_name) REFERENCES PROJECT(name),
		FOREIGN KEY (from_username) REFERENCES USERS(username),
    CONSTRAINT check_date CHECK (close_date > creation_date)
);

CREATE TABLE ALLOWED_LABELS(
    name varchar(50) NOT NULL,
    project_name varchar(50) NOT NULL,
    PRIMARY KEY (name, project_name),
    FOREIGN KEY (project_name) REFERENCES PROJECT(name)
);

CREATE TABLE LABEL (
    name varchar(50),
		project_name varchar(50),
    issue_id int NOT NULL,
    PRIMARY KEY (name, issue_id),
    FOREIGN KEY (name, project_name) REFERENCES ALLOWED_LABELS(name, project_name),
		FOREIGN KEY (project_name) REFERENCES PROJECT(name),
    FOREIGN KEY (issue_id) REFERENCES ISSUE(id)
);

CREATE TABLE STATES_TRANSITIONS(
    previous_state_name varchar(50),
    next_state_name varchar(50),
	project_name varchar(50),
    PRIMARY KEY (previous_state_name, next_state_name, project_name),
    FOREIGN KEY (previous_state_name, project_name) 
	REFERENCES ALLOWED_STATES(name, project_name),
    FOREIGN KEY (next_state_name, project_name) 
	REFERENCES ALLOWED_STATES(name, project_name)
);

CREATE TABLE COMMENT (
    id serial,
    date timestamp,
		from_username varchar(20),
    text varchar(250),
    issue_id int,
    PRIMARY KEY(id),
		FOREIGN KEY (from_username) REFERENCES USERS(username),
    FOREIGN KEY (issue_id) REFERENCES ISSUE(id)
);

COMMIT;
