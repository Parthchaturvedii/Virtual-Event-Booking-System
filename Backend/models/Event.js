const mongoose = require("mongoose")

const eventSchema = new mongoose.Schema({

title:String,

description:String,

date:String,

speaker:String,

meetingLink:String

})

module.exports = mongoose.model("Event",eventSchema)