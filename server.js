// require('dotenv').config({path: "./env"})
import dotenv from "dotenv"
import monogdb_connection from './src/db/mongo.js'
import { app } from "./src/app.js"

const PORT = process.env.PORT || 8000;

dotenv.config({
    path: "./env"
})

monogdb_connection()
    .then(() => { 
        app.listen(PORT, ()=>{
            console.log(`app sahi se connect ho gya h http://localhost:${PORT}`)
        })
     })
    .catch((error) => {
        console.log(`"mongo fat gaya h sahi kro !! " ${error}`)
    })