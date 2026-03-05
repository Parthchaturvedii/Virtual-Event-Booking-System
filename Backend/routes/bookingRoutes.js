const express = require("express")
const router = express.Router()
const Booking = require("../models/Booking")

router.post("/book", async (req,res)=>{

const {userId,eventId} = req.body

const booking = new Booking({
userId,
eventId
})

await booking.save()

res.json({message:"Event booked"})
})

router.get("/my-bookings/:userId", async (req,res)=>{

const bookings = await Booking.find({
userId:req.params.userId
}).populate("eventId")

res.json(bookings)

})

module.exports = router