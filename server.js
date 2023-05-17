`use strict`;
const express = require('express');
const server = express();
const cors = require('cors')
server.use(cors());
require('dotenv').config();
const axios = require('axios');
const PORT = 3003;   //process.env.PORT || 3001;
const data = require(`./movieData/data.json`);
const pg = require('pg');
const apiKey = process.env.APIKey; //  To Run the code with my APIKey copy it from(./env.sample)
server.use(express.json());

const client = new pg.Client(process.env.PGURL)
//---------------------------------------------------------------------------

server.get(`/`, homeHandler);
server.get(`/favorite`, favoritePageHandler);
server.get(`/trending`, trendingPageHandler);
server.get('/getMovies', getMoviesHandler);
server.post('/addMovies', addMovieHandler);
//lab 19 ----------------------------------------------------------------------------
server.delete('/deleteMovie/:id', deleteMovieHandler);
server.put('/upDateMovie/:id', updateMovieHandler);
//-----------------------------------------------------------------------------------
server.get(`*`, defaultHandler);
server.use(errorHandler);

//lab 18------------------------------------------------------------------------------------
function homeHandler(req, res) {
    const movie = new Movie(data.title, data.poster_path, data.overview)
    res.status(200).send(movie);
};


function favoritePageHandler(req, res) {
    const sql = `SELECT * FROM addMovie;`;
    client.query(sql)
        .then(data => {
            res.send(data.rows);
            console.log('data from DB', data.rows)
        }).catch((error) => {
            errorHandler(error, req, res)
        })
};
function getMoviesHandler(req, res) {

    const sql = `SELECT * FROM addMovie`;
    client.query(sql)
        .then(data => {
            res.send(data.rows);
        })

        .catch((error) => {
            errorHandler(error, req, res)
        })
}
function trendingPageHandler(req, res) {
    let url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`;

    try {
        axios.get(url)
            .then(result => {
                let mapResult = result.data.results.map(item => {
                    let theMovie = new Item(item.id, item.title, item.release_date, item.poster_path, item.overview);
                    return theMovie;
                })
                res.send(mapResult);
            })
            .catch((error) => {
                console.log('sorry you have something error', error);
                res.status(500).send(error);
            })
    }
    catch (error) {
        errorHandler(error, req, res)
    }
}

function addMovieHandler(req, res) {
    const newMovie = req.body;
    console.log(newMovie);
    const sql = `INSERT INTO addMovie (id, title, release_date, poster_path, overview,comments)
    VALUES ($1, $2, $3, $4, $5,$6);`
    const values = [newMovie.id, newMovie.title, newMovie.release_date, newMovie.poster_path, newMovie.overview, newMovie.comments];
    client.query(sql, values)
        .then(data => {
            res.send("The data has been added successfully");
        })
        .catch((error) => {
            errorHandler(error, req, res)
        })
}

function defaultHandler(req, res) {
    res.status(404).send('page not found')
};
// lab 19 ------------------------------------------------------------------------------
function deleteMovieHandler(req, res) {

    const id = req.params.id;
    const sql = `DELETE FROM addMovie WHERE id=${id} RETURNING *;`;

    client.query(sql)
        .then((response) => {
            res.send("The movie has been removed successfully from the FavList")
        })
        .catch((error) => {
            console.log('sorry you have something error', error)
            res.status(500).send(error);
        })
}

function updateMovieHandler(req, res) {

    const id = req.params.id;
    const upfavMovie = req.body;
    const sql = `UPDATE addMovie
    SET comment = $1 WHERE id = ${id} RETURNING *;`;
    const values = [upfavMovie.comment];
    client.query(sql, values)
        .then(data => {
            const sql = `SELECT * FROM addMovie;`;
            client.query(sql)
                .then(allData => {
                    res.send(allData.rows)
                })
                .catch((error) => {
                    errorHandler(error, req, res)
                })
        })
        .catch((error) => {
            console.log('sorry you have something error', error)
            res.status(500).send(error);
        })

}

//-------------------------------------------------------------------------------------
function Movie(title, release_date, poster_path, overview) {
    this.title = title;
    this.release_date = release_date;
    this.poster_path = poster_path;
    this.overview = overview;
}

function Item(id, title, release_date, poster_path, overview) {
    this.id = id;
    this.title = title;
    this.release_date = release_date;
    this.poster_path = poster_path;
    this.overview = overview;
}

function errorHandler(error, req, res) {
    const err = {
        status: 500,
        message: error
    }
    res.status(500).send(err);
}


client.connect()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Listening on ${PORT}: I'm ready`)
        })
    })