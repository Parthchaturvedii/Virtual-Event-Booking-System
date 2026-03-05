const express = require("express")
const cors = require("cors")
const connectDB = require("./config/db")

const authRoutes = require("./routes/authRoutes")
const eventRoutes = require("./routes/eventRoutes")
const bookingRoutes = require("./routes/bookingRoutes")

const app = express()

connectDB()

app.use(cors())
app.use(express.json())

app.use("/api/auth",authRoutes)
app.use("/api",eventRoutes)
app.use("/api",bookingRoutes)

app.listen(5000,()=>{
console.log("Server running on port 5000")
})