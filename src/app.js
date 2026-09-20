const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const pool = require('./config/database');

const authRoutes =
    require('./routes/authRoutes');

const userRoutes =
    require('./routes/userRoutes');

const googleRoutes =
    require('./routes/googleRoutes');

const googleDriveRoutes =
    require('./routes/googleDriveRoutes');

const libraryRoutes =
    require('./routes/libraryRoutes');

const errorHandler =
    require('./middlewares/errorHandler');


const app = express();


app.use(helmet());

app.use(cors());

app.use(express.json());

app.use(cookieParser());

app.use(
    express.static(
        path.join(
            __dirname,
            '../public'
        )
    )
);


app.use(
    morgan('dev', {
        skip: (req) =>
            req.path === '/google/callback'
    })
);


app.get(
    '/',
    (req, res) => {

        return res.status(200).json({
            message:
                'Video Study API funcionando!'
        });

    }
);


app.get(
    '/health/database',
    async (req, res) => {

        try {

            const result =
                await pool.query(`
                    SELECT
                        NOW() AS current_time,
                        current_database() AS database,
                        current_user AS user
                `);


            return res.status(200).json({
                status:
                    'ok',

                database:
                    'connected',

                databaseName:
                result.rows[0].database,

                user:
                result.rows[0].user,

                timestamp:
                result.rows[0].current_time
            });


        } catch (error) {

            console.error(error);


            return res
                .status(500)
                .json({
                    status:
                        'error',

                    database:
                        'disconnected'
                });

        }

    }
);


app.use(
    '/auth',
    authRoutes
);


app.use(
    '/users',
    userRoutes
);


app.use(
    '/google',
    googleRoutes
);


app.use(
    '/google/drive',
    googleDriveRoutes
);


app.use(
    '/library',
    libraryRoutes
);


app.use(errorHandler);


module.exports = app;