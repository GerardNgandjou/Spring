package com.reli237.web_application_chat.service

import com.reli237.web_application_chat.dto.PrivateDto
import com.reli237.web_application_chat.model.PrivateChat
import com.reli237.web_application_chat.repository.PrivateChatRepository
import com.reli237.web_application_chat.repository.UsersRepository
import org.springframework.http.ResponseEntity
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class PrivateChatService(
    private val privateChatRepository: PrivateChatRepository,
    private val usersRepository: UsersRepository,
    private val messagingTemplate: SimpMessagingTemplate
) {

    @Transactional
    fun sendMessage(senderId: Long, request: PrivateDto.PrivateChatRequest): PrivateDto.PrivateChatResponse {
        // Vérifiez que l'expéditeur n'envoie pas à lui-même
        if (senderId == request.senderId2) {
            throw IllegalArgumentException("Cannot send message to yourself")
        }

        val sender = usersRepository.findById(senderId)
            .orElseThrow { IllegalArgumentException("Sender not found") }

        val receiver = usersRepository.findById(request.senderId2)
            .orElseThrow { IllegalArgumentException("Receiver not found") }

        val chatMessage = PrivateChat(
            senderId1 = sender,
            senderId2 = receiver,
            content = request.content.trim()
        )

        val savedMessage = privateChatRepository.save(chatMessage)

        // Convert to response DTO
        val response = convertToResponse(savedMessage)

        // **AJOUTEZ DES LOGS pour déboguer**
        println("Sending WebSocket notifications:")
        println("- To receiver: ${receiver.id} (${receiver.email})")
        println("- To sender: ${sender.id} (${sender.email})")

        // **NOTIFIEZ LE DESTINATAIRE SEULEMENT**
        messagingTemplate.convertAndSend(
            "/topic/private/${receiver.id}",
            PrivateChatNotification(
                messageId = savedMessage.id,
                senderId = sender.id,
                senderName = sender.email,
                content = savedMessage.content,
                timestamp = savedMessage.timestamp,
                unreadCount = getUnreadCount(receiver.id),
                isOwnMessage = false  // Pour le destinataire
            )
        )

        // **NOTIFIEZ L'EXPÉDITEUR (optionnel, mais avec un flag différent)**
        messagingTemplate.convertAndSend(
            "/topic/private/${sender.id}",
            PrivateChatNotification(
                messageId = savedMessage.id,
                senderId = sender.id,
                senderName = sender.email,
                content = savedMessage.content,
                timestamp = savedMessage.timestamp,
                unreadCount = getUnreadCount(sender.id),
                isOwnMessage = true  // Pour l'expéditeur
            )
        )

        return response
    }

    fun getChatBetweenUsers(userId1: Long, userId2: Long): List<PrivateDto.PrivateChatResponse> {
        val messages = privateChatRepository.findChatBetweenUsers(userId1, userId2)
        return messages.map { convertToResponse(it) }
    }

    fun getAllPrivateChats(): List<PrivateDto.PrivateChatResponse> {
        return privateChatRepository.findAll()
            .map { convertToResponseChat(it) }
    }

    private fun convertToResponseChat(chat: PrivateChat): PrivateDto.PrivateChatResponse {
        return PrivateDto.PrivateChatResponse(
            id = chat.id,
            senderId1 = chat.senderId1.id,
            senderId2 = chat.senderId2.id,
            senderName1 = chat.senderId1.email,
            senderName2 = chat.senderId2.email,
            content = chat.content,
            timestamp = chat.timestamp,
            isRead = chat.isRead
        )
    }


    fun getUserChats(userId: Long): List<PrivateDto.PrivateChatResponse> {
        val messages = privateChatRepository.findUserChats(userId)
        return messages.map { convertToResponse(it) }
    }

    fun getUserContacts(userId: Long): List<UserContactDTO> {
        val contacts = privateChatRepository.findUserContacts(userId)
        return contacts.map { contact ->
            val lastMessage = privateChatRepository
                .findChatBetweenUsers(userId, contact.id)
                .lastOrNull()

            UserContactDTO(
                userId = contact.id,
                username = contact.email,
                lastMessage = lastMessage?.content ?: "",
                lastMessageTime = lastMessage?.timestamp,
                unreadCount = privateChatRepository
                    .findChatBetweenUsers(userId, contact.id)
                    .count { it.senderId2.id == userId && !it.isRead }
            )
        }
    }

    @Transactional
    fun markMessagesAsRead(userId: Long, request: PrivateDto.MarkAsReadRequest) {
        val updatedCount = privateChatRepository.markMessagesAsRead(request.messageIds, userId)

        if (updatedCount > 0) {
            // Notify sender that messages have been read
            val messages = privateChatRepository.findMessagesByIdsAndUser(request.messageIds, userId)
            messages.firstOrNull()?.let { firstMessage ->
                val senderId = firstMessage.senderId1.id
                messagingTemplate.convertAndSend(
                    "/topic/private/read/${senderId}",
                    MessagesReadNotification(
                        messageIds = request.messageIds,
                        readerId = userId
                    )
                )
            }
        }
    }

    fun getUnreadCount(userId: Long): Long {
        return privateChatRepository.countUnreadMessages(userId)
    }

    private fun convertToResponse(chat: PrivateChat): PrivateDto.PrivateChatResponse {
        return PrivateDto.PrivateChatResponse(
            id = chat.id,
            senderId1 = chat.senderId1.id,
            senderId2 = chat.senderId2.id,
            senderName1 = chat.senderId1.email,
            senderName2 = chat.senderId2.email,
            content = chat.content,
            timestamp = chat.timestamp,
            isRead = chat.isRead
        )
    }

    // DTOs pour les notifications WebSocket
    data class PrivateChatNotification(
        val messageId: Long,
        val senderId: Long,
        val senderName: String,
        val content: String,
        val timestamp: LocalDateTime,
        val unreadCount: Long = 0,
        val isOwnMessage: Boolean = false
    )

    data class UserContactDTO(
        val userId: Long,
        val username: String,
        val lastMessage: String,
        val lastMessageTime: LocalDateTime?,
        val unreadCount: Int
    )

    data class MessagesReadNotification(
        val messageIds: List<Long>,
        val readerId: Long
    )
}