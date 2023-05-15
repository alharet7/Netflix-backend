DROP TABLE IF EXISTS addMovie;


CREATE TABLE IF NOT EXISTS addMovie (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    release_date DATE,
    poster_path TEXT,
    overview TEXT ,
    comments TEXT
);