package com.reli237.web_application_chat.dto

import com.reli237.web_application_chat.model.ChatRoom
import com.reli237.web_application_chat.model.MessageType
import java.time.LocalDateTime

class MessageDto {

    // Request DTOs
    data class MessageCreateRequest(
        val content: String,
        val chatRoomId: Long,
        val messageType: MessageType = MessageType.TEXT
    )

    data class MessageUpdateRequest(
        val content: String? = null
    )

    // Response DTOs
    data class MessageResponse(
        val id: Long,
        val content: String,
        val sender: UserDto.UserSimpleResponse,
        val chatRoomId: Long,
        val timestamp: LocalDateTime,
        val messageType: MessageType,
        val isDeleted: Boolean
    )

    data class MessageDetailResponse(
        val id: Long,
        val content: String,
        val sender: UserDto.UserResponse,
        val chatRoom: ChatRoom,
        val timeStamp: LocalDateTime,
        val messageType: MessageType,
        val isDeleted: Boolean
    )

}