import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";


const app = express();
// middlewere
app.use(cors(
   { origin: process.env.CORS_ORIGIN}
))
// json data
app.use(express.json({limit: "16kb"}))
// encode your url data 
app.use(express.urlencoded({extended: true, limit: "16kb" }))
// public imgs 
app.use(express.static("public "))
// server se cookies ko read krna or access krna crud operation kr sakte h 
app.use(cookieParser())


// routes import 

import userRouter from "./routes/user.routes.js"



// router declarations 
app.use("/api/v1/user", userRouter)

export {app}