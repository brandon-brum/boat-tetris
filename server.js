const express = require('express')
const app = express()
const port = 4444

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/game.html')
})
app.listen(port)