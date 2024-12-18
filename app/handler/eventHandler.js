const express = require('express')
const router = express.Router()
const config = require('config')
const eventRouter = require(process + `/adapter/${config.adapter}/router`)

router.post('/', (request, response) => {
    // 转换成标准事件对象
    eventRouter.route(request)
        .then(value => {

        })
        .then(value => {
            // 路由事件到不同组件上
        })
})