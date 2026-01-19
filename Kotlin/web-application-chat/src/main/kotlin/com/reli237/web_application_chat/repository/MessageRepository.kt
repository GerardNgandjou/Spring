package com.reli237.web_application_chat.repository

import com.reli237.web_application_chat.model.ChatRoom
import com.reli237.web_application_chat.model.Message
import com.reli237.web_application_chat.model.MessageType
import com.reli237.web_application_chat.model.Users
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface MessageRepository: JpaRepository<Message, Long> {

    fun findByChatRoom(chatRoom: ChatRoom): List<Message>

    fun findByChatRoomIdOrderByTimeStampDesc(chatRoomId: Long): List<Message>

    fun findBySender(sender: Users): List<Message>

    fun findByIsDeletedFalse(): List<Message>

    fun findByChatRoomIdAndIsDeletedFalse(chatRoomId: Long): List<Message>

    fun countByChatRoomId(chatRoomId: Long): Long

    fun countBySenderId(senderId: Long): Long

    fun findByMessageType(messageType: MessageType): List<Message>

}