const axios = require('axios').create({
	baseURL: 'http://' + require('../config.json')
})

/**
 * 默认发送消息
 * @param router
 * @param content
 * @returns {Promise<void>}
 */
exports.defaultSendMessage = async (router, content) => {
	if (router.chat === 'channel') {
		exports.sendGroup(router.event.groupId, content)
	} else if (router.chat === 'user'){
		exports.sendUser(router.event.userId, content)
	}
}

/**
 * 发送用户消息
 * @param userId
 * @param message
 * @returns {Promise<*>}
 */
exports.sendUser = async (userId, message, groupId) => {
	const data = {
		user_id: String(userId),
		message: typeof message === 'object' ? JSON.stringify(message) : String(message)
	}
	if (groupId) {
		data.group_id = groupId
	}
	const res = await axios.post('/send_private_msg', data)
	if (res.data === 0) {
		return res.data.data.message_id
	}
}

/**
 * 发送群消息
 * @param groupId
 * @param message
 * @returns {Promise<*>}
 */
exports.sendGroup = async (groupId, message) => {
	const res = await axios.post('/send_group_msg', {
		group_id: String(groupId),
		message: typeof message === 'object' ? JSON.stringify(message) : String(message)
	})
	if (res.data === 0) {
		return res.data.data.message_id
	}
}

/**
 * 回复消息
 * @param event
 * @param content
 * @returns {Promise<*>}
 */
exports.reply = async (event, content) => {
	if (event.groupId == undefined) {
		return await bot.sendUser(event.userId, content)
	} else {
		return await bot.sendGroup(event.groupId, content)
	}
}

/**
 * 获取机器人信息
 * @returns {Promise<{userName: any, userId: string}>}
 */
exports.me = async () => {
	const res = await axios.get('/get_login_info')
	if (res.data.retcode === 0) {
		return {
			userId: String(res.data.data.user_id),
			userName: res.data.data.nickname
		}
	}
}

/**
 * 撤回消息
 * @param messageId
 * @returns {Promise<void>}
 */
exports.recall = async messageId => {
	await axios.post('/delete_msg', {
		message_id: String(messageId)
	})
}

/**
 * 移出群成员
 * @param groupId
 * @param userId
 * @param block
 * @returns {Promise<void>}
 */
exports.removeGroupMember = async (groupId, userId, block) => {
	await axios.post('/set_group_kick', {
		group_id: String(groupId),
		user_id: String(userId),
		reject_add_request: Boolean(block)
	})
}

/**
 * 禁言群成员
 * @param groupId
 * @param userId
 * @param duration
 */
exports.muteGroupMember = async (groupId, userId, duration) => {
	await axios.post('/set_group_ban', {
		group_id: String(groupId),
		user_id: String(userId),
		duration: Number(duration) * 60
	})
}

exports.muteGroup = async (groupId, isMute) => {
	await axios.post('/set_group_whole_ban', {
		group_id: String(groupId),
		enable: Boolean(isMute)
	})
}

/**
 * 设置群管理员
 * @param String groupId 群id
 * @param String userId 用户id
 * @param String isAdmin 是否为管理员
 */
exports.setGroupAdmin = async (groupId, userId, isAdmin) => {
	await axios.post('/set_group_whole_ban', {
		group_id: String(groupId),
		user_id: String(userId),
		enable: Boolean(isAdmin)
	})
}

/**
 * 设置群成员名片
 * @param String groupId 群id
 * @param String userId 用户id
 * @param String card 名片
 */
exports.setGroupUserCard = async (groupId, userId, card) => {
	await axios.post('/set_group_card', {
		group_id: String(groupId),
		user_id: String(userId),
		card: card
	})
}

/**
 * 设置群名
 * @param String groupId 群id
 * @param String groupName 群名
 */
exports.setGroupName = async (groupId, groupName) => {
	await axios.post('/set_group_card', {
		group_id: String(groupId),
		group_name: groupName
	})
}

/**
 * 退出群
 * @param String groupId 群id
 */
exports.leaveGroup = async groupId => {
	await axios.post('/set_group_card', {
		group_id: String(groupId),
		is_dismiss: false
	})
}

/**
 * 解散群
 * @param String groupId 群id
 */
exports.dissolveGroup = async groupId => {
	await axios.post('/set_group_card', {
		group_id: String(groupId),
		is_dismiss: true
	})
}

/**
 * 处理好友申请
 * @param String token
 * @param Boolean isApprove 是否同意
 */
exports.handleFriendRequest = async (token, isApprove) => {
	if (isApprove == undefined) {
		isApprove = true
	}
	await axios.post('/set_friend_add_request', {
		flag: token,
		approve: Boolean(isApprove)
	})
}

/**
 * 处理群申请
 * @param String token
 * @param Boolean isApprove 是否同意
 * @param String [message] 拒绝理由
 */
exports.handleGroupRequest = async (token, isApprove, message) => {
	if (isApprove == undefined) {
		isApprove = true
	}
	await axios.post('/set_group_add_request', {
		sub_type: 'add',
		flag: token,
		approve: Boolean(isApprove),
		reason: message
	})
}

/**
 * 处理群邀请
 * @param String token
 * @param Boolean isApprove 是否同意
 * @param String [message] 拒绝理由
 */
exports.handleGroupInvitation = async (token, isApprove, message) => {
	await axios.post('/set_group_card', {
		sub_type: 'invite',
		flag: token,
		approve: Boolean(isApprove),
		reason: message
	})
}

/**
 * 删除好友
 * @param String user_id 用户id
 */
exports.deleteFriend = async userId => {
	await axios.post('/set_group_card', {
		friend_id: String(userId)
	})
}

/**
 * 获取自身信息
 * @return User user: 用户
 */
exports.getSelf = async () => {
	await axios.post('/set_group_card', {
		id: String(res.data.data.user_id),
		name: res.data.data.nickname
	})
}

/**
 * 获取用户信息
 * @param Object object: userId(用户id)
 * @return User user: 用户
 */
exports.user = async userId => {
	const res = await axios.post('/get_stranger_info', {
		user_id: String(userId)
	})
	return {
		id: String(res.data.data.user_id),
		name: res.data.data.nickname,
		sex: res.data.data.sex,
		age: res.data.data.age,
		level: res.data.data.level
	}
}

/**
 * 获取好友列表
 * @return User[] users: 好友列表
 */
exports.friends = async () => {
	const friendList = new Array()
	const res = await axios.post('/get_friend_list', {
		user_id: String(userId)
	})
	if (res.data.retcode === 0) {
		for(let i = 0; i < res.data.data.length; i++) {
			friendList.push({
				id: String(res.data.data[i].user_id),
				name: res.data.data[i].nickname
			})
		}
	}
	return friendList
}

/**
 * 获取群信息
 * @param String groupId 群id
 * @return Group group: 群
 */
exports.group = async groupId => {
	const res = await axios.post('/get_group_info', {
		group_id: String(groupId),
		no_cache: false
	})
	return {
		id: String(res.data.data.group_id),
		name: String(res.data.data.group_name),
		member: res.data.data.member_count,
		maxMember: res.data.data.max_member_count
	}
}

/**
 * 获取群列表
 * @return Group[] groups: 群列表
 */
exports.groups = async () => {
	const groupList = new Array()
	const res = await axios.post('/get_group_list', {})
	if (res.data.retcode === 0) {
		for(var i = 0; i < res.data.data.length; i++) {
			groupList.push({
				id: String(res.data.data[i].group_id),
				name: String(res.data.data[i].group_name),
				member: res.data.data[i].member_count,
				maxMember: res.data.data[i].max_member_count
			})
		}
	}
	return groupList
}

/**
 * 获取群用户
 * @param String groupId 群id
 * @param String userId 用户id
 * @return GroupUser groupUser: 群成员
 */
exports.getGroupMember = async (groupId, userId) => {
	const res = await axios.post('/get_group_member_info', {
		group_id: String(groupId),
		user_id: String(userId),
		no_cache: false
	})
	if (res.data.retcode === 0) {
		return {
			id: String(res.data.data.user_id),
			name: res.data.data.nickname,
			card: res.data.data.card,
			sex: res.data.data.sex,
			age: res.data.data.age,
			joinTimeStamp: res.data.data.last_sent_time,
			joinDate: new Date(Number(res.data.data.join_time) * 1000),
			lastSpeakTimeStamp: res.data.data.last_sent_time,
			lastSpeakDate: new Date(Number(res.data.data.last_sent_time) * 1000),
			muteEndTimeStamp: res.data.data.shut_up_timestamp,
			muteEndDate: new Date(Number(res.data.data.shut_up_timestamp) * 1000),
			level: res.data.data.level,
			role: res.data.data.role
		}
	}
}

/**
 * 获取群成员列表
 * @param String groupId 群id
 * @return GroupUser[] groupUsers: 群成员列表
 */
exports.groupMembers = async groupId => {
	const groupMembers = new Array()
	const res = await axios.post('/get_group_member_list', {
		group_id: String(groupId)
	})
	if (res.data.retcode === 0) {
		for(var i = 0; i < res.data.data.length; i++) {
			groupMembers.push({
				id: String(res.data.data[i].user_id),
				name: res.data.data[i].nickname,
				card: res.data.data[i].card,
				sex: res.data.data[i].sex,
				age: res.data.data[i].age,
				joinTimeStamp: res.data.data[i].last_sent_time,
				joinDate: new Date(Number(res.data.data[i].join_time) * 1000),
				lastSpeakTimeStamp: res.data.data[i].last_sent_time,
				lastSpeakDate: new Date(Number(res.data.data[i].last_sent_time) * 1000),
				muteEndTimeStamp: res.data.data[i].shut_up_timestamp,
				muteEndDate: new Date(Number(res.data.data[i].shut_up_timestamp) * 1000),
				level: res.data.data[i].level,
				role: res.data.data[i].role
			})
		}
		return groupMembers
	} else {
		throw new Error('Request is failed')
	}
}

/**
 * 获取 at 的文本代码
 * @param String userId: 用户id
 * @return String atCode
 */
exports.at = userId => {
	return '[CQ:at,qq=' + userId + ']'
}

/**
 * 获取 image 的文本代码
 * @param image
 * @returns {string}
 */
exports.image = (image, cache) => {
	let prefix = '[CQ:image,'
	if (!cache) {
		prefix += 'cache=0,'
	}
	return prefix + 'file=' + image + ']'
}