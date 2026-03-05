const events = [
{
id:1,
title:"AI Workshop",
date:"20 March 2026",
speaker:"Dr. Sharma"
},

{
id:2,
title:"Web Development Bootcamp",
date:"25 March 2026",
speaker:"Rahul Mehta"
},

{
id:3,
title:"Cyber Security Seminar",
date:"30 March 2026",
speaker:"Ankit Verma"
}
]

const container = document.getElementById("eventsContainer")

events.forEach(event => {

const card = document.createElement("div")
card.className="event-card"

card.innerHTML = `
<h3>${event.title}</h3>
<p>Date: ${event.date}</p>
<p>Speaker: ${event.speaker}</p>
<button onclick="viewEvent(${event.id})">View Details</button>
`

container.appendChild(card)

})

function viewEvent(id){
window.location.href = "event.html?id="+id
}