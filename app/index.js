const express = require('express')
const bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.json())
app.use(require('./handler/eventHandler'))

app.listen(9600, () => {
    console.log('uu starting')
})