const params = new URLSearchParams(window.location.search)
const eventId = params.get("id")

const eventDetails = document.getElementById("eventDetails")

eventDetails.innerHTML = `
<h2>Event ID: ${eventId}</h2>
<p>This is a virtual learning event.</p>
`

function bookEvent(){
alert("Event booked successfully!")
}