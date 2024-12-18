const labelColor = {
	message: {
		channel: '#CE93D8',
		user: '#64B5F6'
	},
	notice: {
		channel: '#AB47BC',
		user: '#039BE5'
	}
}
const axios = require('axios')
let ocr
try {
	// ocr = require(`${process.cwd()}/util/baidu-ocr`)
} catch (e) { }
// 每天清洗名字容器缓存
const nameCache = {
	groups: {},
	users: {}
}
setInterval(() => {
	nameCache.groups = {}
	nameCache.users = {}
}, 1000 * 60 * 60 * 24)

exports.route = async function(json) {
	// 初始化 router 对象
	const data = JSON.parse(json)
	// 忽略心跳事件
	if (data.post_type === 'meta_event' && (data.meta_event_type === 'lifecycle') || data.meta_event_type === 'heartbeat') {
		return
	}
	const router = {}, event = {}, log = {}
	router.event = event;
	router.log = log

	// 设置 event 基本属性
	event.botId = String(data.self_id)
	event.botName = await getNameFormCache('user', event.botId)
	event.botDescription = event.botName + '(' + event.botId + ')'
	if (data.group_id != undefined) {
		event.groupId = String(data.group_id)
		event.groupName = await getNameFormCache('group', event.groupId)
		event.groupDescription = event.groupName + '(' + event.groupId + ')'
	}
	if (data.user_id != undefined) {
		event.userId = String(data.user_id)
		event.userName = await getNameFormCache('user', event.userId)
		event.userDescription = event.userName + '(' + event.userId + ')'
	}

	// 设置 router 基本属性
	if (data.group_id != undefined) {
		router.channel = String(data.group_id)
	}
	if (data.user_id != undefined) {
		router.user = String(data.user_id)
	}

	// 设置 log 基本属性
	log.time = getNowTimeText()
	log.title = event.groupId ? event.groupDescription : event.userDescription
	log.origin = event.botDescription
	log.type = 'event'

	// 设置 router 基本属性
	if (data.post_type === 'message') {
		router.type = 'message'
		router.content = data.raw_message
		if (data.message_type === 'group') {
			router.chat = 'channel'
		} else if (data.message_type === 'private') {
			router.chat = 'user'
		} else {
			// 发现未定义的消息类型, 不能继续处理
			return
		}
		// 处理消息的 subtype
		await handleMessageForMore(router)

		// 进一步设置 event 属性
		event.content = data.raw_message
		event.messageId = data.message_id
		log.color = event.groupId ? labelColor.message.channel : labelColor.message.user
		log.content = event.groupId ? event.userDescription + ': \n' + event.content : event.content
	} else if (data.post_type === 'notice') {
		router.type = 'notice'
		if (data.notice_type === 'friend_recall' || data.notice_type === 'group_recall') {
			parseRecall(router, data)
		} else if (data.notice_type === 'friend_add') {
			parseFriendIncrease(router, data)
		} else if (data.notice_type === 'group_admin' && data.sub_type === 'set') {
			parseGroupAdminIncrease(router, data)
		} else if (data.notice_type === 'group_admin' && data.sub_type === 'unset') {
			parseGroupAdminDecrease(router, data)
		} else if (data.notice_type === 'group_increase') {
			parseGroupMemberIncrease(router, data)
		} else if (data.notice_type === 'group_decrease') {
			parseGroupMemberDecrease(router, data)
		} else if (data.notice_type === 'group_ban' && data.sub_type === 'ban') {
			parseGroupMemberMute(router, data)
		} else if (data.notice_type === 'group_ban' && data.sub_type === 'lift_ban') {
			parseGroupMemberUnmute(router, data)
		} else if(data.notice_type === 'group_card') {
			parseGroupMemberCardUpdate(router, data)
		} else {
			// 发现未定义的类型, 不能继续处理
			return
		}
	} else if (data.post_type === 'request') {
		router.type = 'notice'
		if (data.request_type === 'friend') {
			parseFriendRequest(router, data)
		} else if (data.request_type === 'group' && data.sub_type === 'add') {
			parseGroupRequest(router, data)
		} else if (data.request_type === 'group' && data.sub_type === 'invite') {
			parseGroupInvite(router, data)
		} else {
			// 发现未定义的类型, 不能继续处理
			return
		}
	} else {
		// 发现未定义的事件类型, 不能继续处理
		return
	}
	/*let data = JSON.parse(json)
	let router = {}
	router.event = {}
	router.log = {}*/
	return router
}


async function handleMessageForMore(router) {
	let log = router.log
	let event = router.event
	if (router.content.includes('[CQ:image')) {
		router.subtype = '图片'
		log.label = '图片'
		event.image = {}
		event.image.url = parseFirstImageUrl(router.content)
		if (event.image.url != undefined) {
			try {
				const resp = await axios.get(event.image.url)
				if (resp.headers['content-type'] != 'image/gif' && new Date(resp.headers['last-modified'] + '+0800').getTime() + 36000000 > new Date().getTime()) {
					// TODO 图片 OCR
					if (ocr) {
						try {
							event.image.text = await ocr(event.image.url)
						} catch(e) {
							console.warn(`'${event.image.url}' image ocr failed`)
						}
					}
				} else {
					router.subtype = '表情包'
					log.label = '表情包'
				}
			} catch (e) { }
		}
	} else {
		router.subtype = 'normal'
		log.label = '普通'
	}
}

// 消息撤回
function parseRecall(router, data) {
	router.subtype = '撤回'
	router.log.label = router.subtype
	if (data.notice_type === 'group_recall') {
		router.chat = 'channel'
		router.log.color = labelColor.notice.channel
		router.log.content = `${router.event.userDescription} 撤回了一条消息`
	} else {
		router.chat = 'user'
		router.log.color = labelColor.notice.user
		router.log.content = `撤回了一条消息`
	}
}

// 新好友
function parseFriendIncrease(router, data) {
	router.chat = 'user'
	router.subtype = '好友增加'
	router.log.label = router.subtype
	router.log.color = labelColor.notice.user
	router.log.content = `${router.event.userDescription} 成为了的新好友`
}

// 群管理员增加事件
function parseGroupAdminIncrease(router, data) {
	router.chat = 'channel'
	router.subtype = '群管理员增加'
	router.log.label = router.subtype
	router.log.color = labelColor.notice.channel
	router.log.content = `${router.event.userDescription} 成为了管理员`
}

// 群管理员减少事件
function parseGroupAdminDecrease(router, data) {
	router.chat = 'channel'
	router.subtype = '群管理员减少'
	router.log.label = router.subtype
	router.log.color = labelColor.notice.channel
	router.log.content = `${router.event.userDescription} 被取消了管理员`
}

// 群成员增加事件
function parseGroupMemberIncrease(router, data) {
	router.chat = 'channel'
	router.subtype = '群成员增加'
	router.event.method = data.sub_type // invite or approve
	router.event.operatorId = String(data.operator_id)
	router.event.userId = String(data.user_id)
	router.log.label = router.subtype
	router.log.color = labelColor.notice.channel
	router.log.content = `${router.event.userDescription} 加入了群`
}

// 群成员减少事件
function parseGroupMemberDecrease(router, data) {
	router.chat = 'channel'
	router.subtype = '群成员减少'
	router.log.label = router.subtype
	router.log.color = labelColor.notice.channel
	router.log.content = `${router.event.userDescription} 离开了群`
}

// 好友请求事件
function parseFriendRequest(router, data) {
	router.chat = 'user'
	router.subtype = '好友请求'
	router.log.label = router.subtype
	router.log.color = labelColor.notice.user
	router.log.content = `${router.event.userDescription} 申请成为你的好友`
	router.event.token = data.flag
}

// 群申请事件
function parseGroupRequest(router, data) {
	router.chat = 'channel'
	router.subtype = '群申请'
	router.log.label = router.subtype
	router.log.color = labelColor.notice.channel
	router.log.content = `${router.event.userDescription} 申请加入群`
	router.event.token = data.flag
}

// 群邀请事件
function parseGroupInvite(router, data) {
	router.chat = 'user'
	router.subtype = '群邀请'
	router.log.label = router.subtype
	router.log.color = labelColor.notice.user
	router.log.content = `${router.event.userDescription} 邀请你进群`
}

// 群成员禁言事件
function parseGroupMemberMute(router, data) {
	router.chat = 'channel'
	router.subtype = '群成员禁言'
	router.event.duration = data.duration / 60		// 禁言时间, 单位分钟
	router.log.label = router.subtype
	router.log.color = labelColor.notice.channel
	router.log.content = `${router.event.userDescription} 被禁言了 ${router.event.duration} 分钟`
}

// 群成员解除禁言事件
function parseGroupMemberUnmute(router, data) {
	router.chat = 'channel'
	router.subtype = '群成员取消禁言'
	router.event.duration = data.duration / 60		// 禁言时间, 单位分钟
	router.log.label = router.subtype
	router.log.color = labelColor.notice.channel
	router.log.content = `${router.event.userDescription} 被取消禁言了`
}

function parseGroupMemberCardUpdate(router, data) {
	router.chat = 'channel'
	router.event.newCard = data.card_new
	router.event.oldCard = data.card_old
	router.subtype = '群成员名片更新'
	router.log.label = router.subtype
	router.log.color = labelColor.notice.channel
	router.log.content = `${router.event.userDescription} 修改新名片(${router.event.newCard})`
}


/**
 * 从缓存中获取名字信息
 * @param type
 * @param id
 * @returns {Promise<string>}
 */
async function getNameFormCache(type, id) {
	let name
	if (type === 'group') {
		name = nameCache.groups[id]
		if (name == undefined) {
			try {
				const group = await bot.group(id)
				name = group.name
				nameCache.groups[id] = name
			} catch (e) {
				name = 'unknown'
			}
		}
	} else if (type === 'user') {
		name = nameCache.users[id]
		if (name == undefined) {
			try {
				const user = await bot.user(id)
				name = user.name
				nameCache.users[id] = name
			} catch (e) {
				name = 'unknown'
			}
		}
	} else {
		name = 'unknown'
	}
	return name
}

/**
 * 解析第一个图片的url
 * @param str
 * @returns {string}
 */
function parseFirstImageUrl(str) {
	const codeLeft = str.indexOf('[CQ:image')
	if (codeLeft === -1) {
		return
	}
	const codeRight = str.indexOf(']', codeLeft)
	if (codeRight === -1) {
		return
	}
	const imageCode = str.substring(codeLeft, codeRight + 1)
	const urlLeft = imageCode.indexOf('url=');
	const urlRight = imageCode.indexOf(',', urlLeft)
	if (urlLeft > -1) {
		if (urlRight > -1) {
			return imageCode.substring(urlLeft + 4, urlRight)
		} else {
			return imageCode.substring(urlLeft + 4, imageCode.length - 1)
		}
	}
}

/**
 * 获取现在时间
 * @returns {string}
 */
function getNowTimeText() {
	const now = new Date()
	const hour = now.getHours()
	const minute = now.getMinutes()
	const second = now.getSeconds()
	return ((hour > 9) ? hour : '0' + hour) + ':' + ((minute > 9) ? minute : '0' + minute) + ':' + ((second > 9) ? second : '0' + second)
}