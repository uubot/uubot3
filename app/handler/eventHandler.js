const express = require('express')
const router = express.Router()
const config = require('config')
const eventRouter = require(process.cwd() + `/adapter/${config.adapter}/router`)

router.post('/bot/event', (request, response) => {
    // 转换成标准事件对象
    eventRouter.route(request, response)
        .then(value => {
            console.log(value)
        })
})

module.exports = router