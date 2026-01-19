package com.reli237.web_application_chat.controller

import com.reli237.web_application_chat.dto.MessageDto
import com.reli237.web_application_chat.service.ChatRoomService
import com.reli237.web_application_chat.service.MessageService
import org.springframework.messaging.handler.annotation.DestinationVariable
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.messaging.handler.annotation.SendTo
import org.springframework.messaging.simp.SimpMessageHeaderAccessor
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.messaging.simp.annotation.SendToUser
import org.springframework.stereotype.Controller
import java.security.Principal

@Controller
class WebChatController(
    private val messageService: MessageService,
    private val chatRoomService: ChatRoomService,
    private val messagingTemplate: SimpMessagingTemplate
) {

    // Send message to a specific chat room
    @MessageMapping("/chat.sendMessage/{roomId}")
    @SendTo("/topic/room/{roomId}")
    fun sendMessage(
        @DestinationVariable roomId: Long,
        @Payload messageRequest: MessageDto.MessageCreateRequest,
        headerAccessor: SimpMessageHeaderAccessor
    ): MessageDto.MessageResponse {
        val principal = headerAccessor.user
        val userId = principal?.name?.toLongOrNull() ?: throw IllegalArgumentException("User not authenticated")

        // Create and save the message
        val messageResponse = messageService.createMessage(userId, messageRequest)

        // Also send to user's private queue for confirmation
        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/messages/confirmation",
            MessageConfirmation(messageResponse.id, "Message sent successfully")
        )

        return messageResponse
    }

    // Add user to chat room
    @MessageMapping("/chat.addUser/{roomId}")
    @SendTo("/topic/room/{roomId}/users")
    fun addUser(
        @DestinationVariable roomId: Long,
        @Payload userId: Long,
        headerAccessor: SimpMessageHeaderAccessor
    ): UserJoinEvent {
        // You might want to validate if user can join the room here

        val username = headerAccessor.user?.name ?: "Anonymous"
        return UserJoinEvent(userId, username, "joined the chat")
    }

    // User is typing notification
    @MessageMapping("/chat.typing/{roomId}")
    @SendTo("/topic/room/{roomId}/typing")
    fun typing(
        @DestinationVariable roomId: Long,
        @Payload typingRequest: TypingRequest
    ): TypingNotification {
        return TypingNotification(typingRequest.userId, typingRequest.isTyping)
    }

    // Private message between users
    @MessageMapping("/chat.private")
    @SendToUser("/queue/private")
    fun sendPrivateMessage(
        @Payload privateMessageRequest: PrivateMessageRequest,
        principal: Principal
    ): PrivateMessageResponse {
        val senderId = principal.name.toLong()

        // Send to recipient
        messagingTemplate.convertAndSendToUser(
            privateMessageRequest.recipientId.toString(),
            "/queue/private",
            PrivateMessageResponse(
                senderId = senderId,
                recipientId = privateMessageRequest.recipientId,
                content = privateMessageRequest.content,
                timestamp = System.currentTimeMillis()
            )
        )

        // Send confirmation back to sender
        return PrivateMessageResponse(
            senderId = senderId,
            recipientId = privateMessageRequest.recipientId,
            content = privateMessageRequest.content,
            timestamp = System.currentTimeMillis(),
            status = "sent"
        )
    }

    // Notify user when their message is read
    @MessageMapping("/chat.message.read/{messageId}")
    fun messageRead(
        @DestinationVariable messageId: Long,
        @Payload readByUserId: Long,
        principal: Principal
    ) {
        val senderId = principal.name.toLong()

        // Notify the original sender that their message was read
        messagingTemplate.convertAndSendToUser(
            senderId.toString(),
            "/queue/messages/read",
            MessageReadNotification(messageId, readByUserId, System.currentTimeMillis())
        )
    }

    // Data classes for WebSocket communication
    data class MessageConfirmation(
        val messageId: Long,
        val status: String
    )

    data class UserJoinEvent(
        val userId: Long,
        val username: String,
        val action: String
    )

    data class TypingRequest(
        val userId: Long,
        val isTyping: Boolean
    )

    data class TypingNotification(
        val userId: Long,
        val isTyping: Boolean
    )

    data class PrivateMessageRequest(
        val recipientId: Long,
        val content: String
    )

    data class PrivateMessageResponse(
        val senderId: Long,
        val recipientId: Long,
        val content: String,
        val timestamp: Long,
        val status: String = "received"
    )

    data class MessageReadNotification(
        val messageId: Long,
        val readByUserId: Long,
        val readAt: Long
    )
}