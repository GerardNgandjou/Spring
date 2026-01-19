package com.reli237.web_application_chat.controller

import com.reli237.web_application_chat.dto.MessageDto
import com.reli237.web_application_chat.service.ChatRoomService
import com.reli237.web_application_chat.service.MessageService
import org.springframework.messaging.handler.annotation.DestinationVariable
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.SendTo
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Controller
import java.security.Principal

@Controller
class WebChatController(
    private val messageService: MessageService,
    private val chatRoomService: ChatRoomService,
    private val messagingTemplate: SimpMessagingTemplate
) {

    /**
     * Handle incoming messages from clients
     * Client sends to: /app/chat/{chatRoomId}/send
     * Message is broadcast to: /topic/chat/{chatRoomId}
     */
    @MessageMapping("/chat/{chatRoomId}/send")
    @SendTo("/topic/chat/{chatRoomId}")
    fun sendMessage(
        @DestinationVariable chatRoomId: Long,
        message: MessageDto.MessageCreateRequest,
        principal: Principal?
    ): MessageDto.MessageResponse {
        val userId = principal?.name?.toLongOrNull() ?: throw IllegalArgumentException("User not authenticated")

        // Verify user is participant of the chat room
        if (!chatRoomService.isUserParticipant(chatRoomId, userId)) {
            throw IllegalAccessException("User is not a participant of this chat room")
        }

        return messageService.createMessage(userId, message.copy(chatRoomId = chatRoomId))
    }

    /**
     * Handle typing notifications
     * Client sends to: /app/chat/{chatRoomId}/typing
     * Notification is broadcast to: /topic/chat/{chatRoomId}/typing
     */
    @MessageMapping("/chat/{chatRoomId}/typing")
    fun handleTypingNotification(
        @DestinationVariable chatRoomId: Long,
        notification: TypingNotificationDto,
        principal: Principal?
    ) {
        val userId = principal?.name?.toLongOrNull() ?: return

        if (!chatRoomService.isUserParticipant(chatRoomId, userId)) {
            return
        }

        messagingTemplate.convertAndSend(
            "/topic/chat/$chatRoomId/typing",
            TypingNotificationDto(userId = userId, isTyping = notification.isTyping)
        )
    }

    /**
     * Handle user presence/status updates
     * Client sends to: /app/chat/{chatRoomId}/presence
     * Notification is broadcast to: /topic/chat/{chatRoomId}/presence
     */
    @MessageMapping("/chat/{chatRoomId}/presence")
    fun handlePresenceNotification(
        @DestinationVariable chatRoomId: Long,
        notification: PresenceNotificationDto,
        principal: Principal?
    ) {
        val userId = principal?.name?.toLongOrNull() ?: return

        if (!chatRoomService.isUserParticipant(chatRoomId, userId)) {
            return
        }

        messagingTemplate.convertAndSend(
            "/topic/chat/$chatRoomId/presence",
            PresenceNotificationDto(
                userId = userId,
                status = notification.status,
                timestamp = System.currentTimeMillis()
            )
        )
    }

    /**
     * Get chat room details via WebSocket
     * Client sends to: /app/chatroom/{chatRoomId}/info
     * Response sent to: /user/{username}/queue/chatroom-info
     */
    @MessageMapping("/chatroom/{chatRoomId}/info")
    fun getChatRoomInfo(
        @DestinationVariable chatRoomId: Long,
        principal: Principal?
    ) {
        val username = principal?.name ?: return

        try {
            val chatRoomDetail = chatRoomService.getChatRoomById(chatRoomId)
            messagingTemplate.convertAndSendToUser(
                username,
                "/queue/chatroom-info",
                chatRoomDetail
            )
        } catch (e: Exception) {
            messagingTemplate.convertAndSendToUser(
                username,
                "/queue/errors",
                ErrorDto(message = e.message ?: "Failed to fetch chat room info")
            )
        }
    }

    /**
     * Get chat history
     * Client sends to: /app/chat/{chatRoomId}/history
     * Response sent to: /user/{username}/queue/chat-history
     */
    @MessageMapping("/chat/{chatRoomId}/history")
    fun getChatHistory(
        @DestinationVariable chatRoomId: Long,
        request: ChatHistoryRequestDto,
        principal: Principal?
    ) {
        val username = principal?.name ?: return

        try {
            val messages = chatRoomService.getChatRoomById(chatRoomId).messages
            messagingTemplate.convertAndSendToUser(
                username,
                "/queue/chat-history",
                messages
            )
        } catch (e: Exception) {
            messagingTemplate.convertAndSendToUser(
                username,
                "/queue/errors",
                ErrorDto(message = e.message ?: "Failed to fetch chat history")
            )
        }
    }

    /**
     * Edit message
     * Client sends to: /app/chat/message/{messageId}/edit
     * Update is broadcast to: /topic/chat/{chatRoomId}/message-updated
     */
    @MessageMapping("/chat/message/{messageId}/edit")
    fun editMessage(
        @DestinationVariable messageId: Long,
        request: MessageDto.MessageUpdateRequest,
        principal: Principal?
    ) {
        val userId = principal?.name?.toLongOrNull() ?: return

        try {
            val updatedMessage = messageService.updateMessage(messageId, request)
            messagingTemplate.convertAndSend(
                "/topic/chat/message-updated",
                updatedMessage
            )
        } catch (e: Exception) {
            messagingTemplate.convertAndSendToUser(
                principal.name,
                "/queue/errors",
                ErrorDto(message = e.message ?: "Failed to update message")
            )
        }
    }

    /**
     * Delete message
     * Client sends to: /app/chat/message/{messageId}/delete
     * Update is broadcast to: /topic/chat/{chatRoomId}/message-deleted
     */
    @MessageMapping("/chat/message/{messageId}/delete")
    fun deleteMessage(
        @DestinationVariable messageId: Long,
        principal: Principal?
    ) {
        val userId = principal?.name?.toLongOrNull() ?: return

        try {
            messageService.deleteMessage(messageId)
            messagingTemplate.convertAndSend(
                "/topic/chat/message-deleted",
                MessageDeletedDto(messageId = messageId)
            )
        } catch (e: Exception) {
            messagingTemplate.convertAndSendToUser(
                principal.name,
                "/queue/errors",
                ErrorDto(message = e.message ?: "Failed to delete message")
            )
        }
    }
}

// DTOs for WebSocket communication
data class TypingNotificationDto(
    val userId: Long,
    val isTyping: Boolean
)

data class PresenceNotificationDto(
    val userId: Long,
    val status: String, // "online", "offline", "away"
    val timestamp: Long = System.currentTimeMillis()
)

data class ChatHistoryRequestDto(
    val limit: Int = 50,
    val offset: Int = 0
)

data class ErrorDto(
    val message: String,
    val timestamp: Long = System.currentTimeMillis()
)

data class MessageDeletedDto(
    val messageId: Long,
    val timestamp: Long = System.currentTimeMillis()
)