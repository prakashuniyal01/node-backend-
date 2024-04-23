
import mongoose from "mongoose";
// import {LOGGER} from '../common/logger.js';

const monogdb_connection = async () => {
    const URI = process.env.MONGO_URL;
    mongoose.connect(URI).then(() => {
        console.log(`DB connected successfully.`)
    }).catch(err => {
        console.log(err);
        process.exit(1);
    })
}

export  {monogdb_connection }