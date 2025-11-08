CREATE TABLE
  IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    birthdate DATE,
    biography TEXT,
    city VARCHAR(255)
  );

INSERT INTO users (first_name, last_name, birthdate, biography, city)
VALUES $VALUES