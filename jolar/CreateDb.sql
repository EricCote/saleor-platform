
-- Connecte-toi en tant que superutilisateur Postgres
CREATE DATABASE jolar;
CREATE USER jolar_usr
WITH PASSWORD 'af123123123!';
GRANT ALL PRIVILEGES ON DATABASE jolar TO jolar_usr;

--From the jolar Database
ALTER SCHEMA public OWNER TO jolar_usr;
GRANT ALL PRIVILEGES ON SCHEMA public TO jolar_usr;


