const express = require("express")
const router = express.Router()
const Event = require("../models/Event")

router.get("/events", async (req,res)=>{

const events = await Event.find()

res.json(events)

})

router.post("/events", async (req,res)=>{

const event = new Event(req.body)

await event.save()

res.json({message:"Event created"})

})

module.exports = router