//require('dotenv').config({path: './env'})
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`server is running on: ${process.env.PORT}`)
    })
})

.catch((error)=>{
    console.log("mongodb connection failed:",error);
})



/*
import mongoose from "mongoose";
import {DB_NAME} from "./constants"

import express from "express"
const app= express()

( async()=>{
    try{
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       app.on("error", ()=>{
        console.error("ERROR:", error)
        throw error
       })

       app.listen(process.env.PORT, ()=>{
        console.log(`app is listening on port ${app.env.PORT}`)
       })
    } catch(error){
        console.error("ERROR:",error)
        throw err
    }
})()
*/