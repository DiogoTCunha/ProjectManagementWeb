BEGIN;
insert into users values ('user1', 'password1');
insert into users values ('user2', 'password2');
insert into users values ('user3', 'password3');

call createProject('projeto1', 'description1', 'state1', 'user1');
call createProject('projeto2', 'description2', 'state2', 'user2');
call createProject('projeto3', 'description3', 'state3', 'user3');

insert into colLaborator values('user2', 'projeto1');
insert into coLlaborator values('user1', 'projeto2');

insert into ALLOWED_LABELS VALUES('label1','projeto1');
insert into ALLOWED_LABELS VALUES('label2','projeto2');
insert into ALLOWED_LABELS VALUES('label3','projeto3');
insert into ALLOWED_LABELS VALUES('label12','projeto1');

call createIssue('issue1', 'description1','projeto1', 'user1','label1','label12');
call createIssue('issue2', 'description2','projeto2', 'user2','label2');
call createIssue('issue3', 'description3','projeto3', 'user3');

insert into allowed_states VALUES ('state12', 'projeto1');
insert into allowed_states VALUES ('state22', 'projeto2');

insert into states_transitions VALUES('state1', 'state12','projeto1');



COMMIT;