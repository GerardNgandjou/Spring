package com.reli237.web_application_chat.dto

import java.time.LocalDateTime

class PrivateDto {

    data class PrivateChatDTO(
        val id: Long? = null,
        val senderId1: Long,
        val senderId2: Long,
        val content: String,
        val timestamp: LocalDateTime? = null,
        val isRead: Boolean = false,
        val senderName1: String? = null,
        val senderName2: String? = null
    )

    data class PrivateChatRequest(
        val senderId2: Long,
        val content: String
    )

    data class PrivateChatResponse(
        val id: Long,
        val senderId1: Long,
        val senderId2: Long,
        val senderName1: String,
        val senderName2: String,
        val content: String,
        val timestamp: LocalDateTime,
        val isRead: Boolean
    )

    data class MarkAsReadRequest(
        val messageIds: List<Long>
    )

    data class TypingNotification(
        val senderId: Long,
        val senderName: String,
        val receiverId: Long,
        val isTyping: Boolean,
        val timestamp: LocalDateTime
    )

    data class TypingStatusDTO(
        val isTyping: Boolean,
        val senderId: Long,
        val conversationId: String? = null
    )

}