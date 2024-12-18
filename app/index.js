const express = require('express')
const app = express()
console.log(process.cwd())
app.get('/', (request, response) => {
    response.send('hello~')
})

app.post('/', (request, response) => {

})

app.listen(9600, () => {
    console.log('uu starting')
})