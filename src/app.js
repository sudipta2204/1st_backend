import expres from "express"
import cookieParser from "cookie-parser"
import cors from "cors"


const app= expres()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

export {app}