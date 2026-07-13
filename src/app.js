import expres, { urlencoded } from "express"
import cookieParser from "cookie-parser"
import cors from "cors"


const app= expres()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(expres.json({limit:"16kb"}))
app.use(urlencoded({extended:true, limit: "16kb"}))
app.use(expres.static("public"))
app.use(cookieParser())

//routes import
import userRouter from "./routs/user.rout.js"

//routes declaration
app.use("/api/v1/users", userRouter)

//https://localhost:8000/api/v1/users/register
export {app}