package com.reli237.web_application_chat.service

import com.reli237.web_application_chat.dto.MessageDto
import com.reli237.web_application_chat.dto.UserDto
import com.reli237.web_application_chat.model.ChatRoom
import com.reli237.web_application_chat.model.Message
import com.reli237.web_application_chat.model.MessageType
import com.reli237.web_application_chat.repository.ChatRoomRepository
import com.reli237.web_application_chat.repository.MessageRepository
import com.reli237.web_application_chat.repository.UsersRepository
import jakarta.persistence.EntityNotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.concurrent.ConcurrentHashMap

@Service
@Transactional
class MessageService(
    private val messageRepository: MessageRepository,
    private val chatRoomRepository: ChatRoomRepository,
    private val usersRepository: UsersRepository

//    private val typingUsers = ConcurrentHashMap<Long, MutableSet<Long>>(),
//    private val messageReadStatus = ConcurrentHashMap<Long, MutableMap<Long, Long>>()
) {
    /**
     * Create a new message in a chat room
     */
    @Transactional
    fun createMessage(userId: Long, request: MessageDto.MessageCreateRequest): MessageDto.MessageResponse {
        // Logs détaillés
        println("📝 ===== CREATE MESSAGE START =====")
        println("📝 User ID: $userId")
        println("📝 Room ID: ${request.chatRoomId}")
        println("📝 Content: ${request.content}")

        // Vérifier l'utilisateur
        val user = usersRepository.findById(userId).orElseThrow {
            println("❌ User $userId not found")
            throw EntityNotFoundException("User not found with id: $userId")
        }
        println("✅ User found: ${user.email}")

        // Vérifier la salle
        val chatRoom = chatRoomRepository.findById(request.chatRoomId).orElseThrow {
            println("❌ Chat room ${request.chatRoomId} not found")
            throw EntityNotFoundException("Chat room not found with id: ${request.chatRoomId}")
        }
        println("✅ Chat room found: ${chatRoom.name}")

        // Créer le message
        val message = Message(
            id = 0,
            content = request.content,
            sender = user,
            chatRoom = chatRoom,
            timeStamp = LocalDateTime.now(),
            messageType = MessageType.TEXT ,
            isDeleted = false
        )

        // Sauvegarder
        val savedMessage = messageRepository.save(message)
        println("✅ Message saved with ID: ${savedMessage.id}")
        println("📝 ===== CREATE MESSAGE END =====")

        // Retourner la réponse
        return MessageDto.MessageResponse(
            id = savedMessage.id,
            content = savedMessage.content,
            sender = UserDto.UserSimpleResponse(
                id = savedMessage.sender.id,
                email = savedMessage.sender.email
                // add only what UserSimpleResponse needs
            ),
            chatRoomId = savedMessage.chatRoom.id,
            timestamp = savedMessage.timeStamp,
            messageType = savedMessage.messageType,
            isDeleted = savedMessage.isDeleted
        )
    }

    /**
     * Get all messages in a chat room
     */
    fun getMessagesByChatRoom(chatRoomId: Long): List<MessageDto.MessageResponse> {
        val chatRoom = chatRoomRepository.findById(chatRoomId)
            .orElseThrow { throw IllegalArgumentException("Chat room not found with id: $chatRoomId") }

        return messageRepository.findByChatRoom(chatRoom)
            .filter { !it.isDeleted }
            .map { mapToMessageResponse(it) }
    }

    /**
     * Get all messages in a chat room ordered by timestamp (newest first)
     */
    fun getMessagesByChatRoomOrdered(chatRoomId: Long): List<MessageDto.MessageResponse> {
        return messageRepository.findByChatRoomIdOrderByTimeStampDesc(chatRoomId)
            .filter { !it.isDeleted }
            .map { mapToMessageResponse(it) }
    }


    /**
     * Get all messages sent by a specific user
     */
    fun getMessagesBySender(senderId: Long): List<MessageDto.MessageResponse> {
        val sender = usersRepository.findById(senderId)
            .orElseThrow { throw IllegalArgumentException("User not found with id: $senderId") }

        return messageRepository.findBySender(sender)
            .filter { !it.isDeleted }
            .map { mapToMessageResponse(it) }
    }

    /**
     * Get all non-deleted messages
     */
    fun getAllActiveMessages(): List<MessageDto.MessageResponse> {
        return messageRepository.findByIsDeletedFalse()
            .map { mapToMessageResponse(it) }
    }

    /**
     * Get all active messages in a chat room
     */
    fun getActiveMessagesByChatRoom(chatRoomId: Long): List<MessageDto.MessageResponse> {
        return messageRepository.findByChatRoomIdAndIsDeletedFalse(chatRoomId)
            .map { mapToMessageResponse(it) }
    }

    /**
     * Get messages by type
     */
    fun getMessagesByType(messageType: MessageType): List<MessageDto.MessageResponse> {
        return messageRepository.findByMessageType(messageType)
            .filter { !it.isDeleted }
            .map { mapToMessageResponse(it) }
    }

    /**
     * Update message content
     */
    fun updateMessage(messageId: Long, request: MessageDto.MessageUpdateRequest): MessageDto.MessageResponse {
        val message = messageRepository.findById(messageId)
            .orElseThrow { throw IllegalArgumentException("Message not found with id: $messageId") }

        if (message.isDeleted) {
            throw IllegalStateException("Cannot update a deleted message")
        }

        if (!request.content.isNullOrBlank()) {
            message.content = request.content
        }

        val updatedMessage = messageRepository.save(message)
        return mapToMessageResponse(updatedMessage)
    }

    /**
     * Soft delete a message
     */
    fun deleteMessage(messageId: Long): MessageDto.MessageResponse {
        val message = messageRepository.findById(messageId)
            .orElseThrow { throw IllegalArgumentException("Message not found with id: $messageId") }

        message.isDeleted = true
        val deletedMessage = messageRepository.save(message)
        return mapToMessageResponse(deletedMessage)
    }

    /**
     * Restore a deleted message
     */
    fun restoreMessage(messageId: Long): MessageDto.MessageResponse {
        val message = messageRepository.findById(messageId)
            .orElseThrow { throw IllegalArgumentException("Message not found with id: $messageId") }

        if (!message.isDeleted) {
            throw IllegalStateException("Message is not deleted")
        }

        message.isDeleted = false
        val restoredMessage = messageRepository.save(message)
        return mapToMessageResponse(restoredMessage)
    }

    /**
     * Permanently delete a message (hard delete)
     */
    fun permanentlyDeleteMessage(messageId: Long) {
        if (!messageRepository.existsById(messageId)) {
            throw IllegalArgumentException("Message not found with id: $messageId")
        }
        messageRepository.deleteById(messageId)
    }

    /**
     * Count total messages in a chat room
     */
    fun countMessagesByChatRoom(chatRoomId: Long): Long {
        return messageRepository.countByChatRoomId(chatRoomId)
    }

    /**
     * Count total messages sent by a user
     */
    fun countMessagesBySender(senderId: Long): Long {
        return messageRepository.countBySenderId(senderId)
    }

    /**
     * Get all messages (including deleted)
     */
    fun getAllMessages(): List<MessageDto.MessageResponse> {
        return messageRepository.findAll()
            .map { mapToMessageResponse(it) }
    }

    /**
     * Map Message entity to MessageResponse DTO
     */
    private fun mapToMessageResponse(message: Message): MessageDto.MessageResponse {
        return MessageDto.MessageResponse(
            id = message.id,
            content = message.content,
            sender = UserDto.UserSimpleResponse(
                id = message.sender.id,
                email = message.sender.email
            ),
            chatRoomId = message.chatRoom.id,
            timestamp = message.timeStamp,
            messageType = message.messageType,
            isDeleted = message.isDeleted
        )
    }

    /**
     * Map Message entity to MessageDetailResponse DTO
     */
    private fun mapToMessageDetailResponse(message: Message): MessageDto.MessageDetailResponse {
        return MessageDto.MessageDetailResponse(
            id = message.id,
            content = message.content,
            sender = UserDto.UserResponse(
                id = message.sender.id,
                email = message.sender.email,
                role = message.sender.role,
                isActive = message.sender.isActive,
                createdAt = message.sender.createdAt
            ),
            chatRoom = mapToChatRoomResponse(message.chatRoom),
            timeStamp = message.timeStamp,
            messageType = message.messageType,
            isDeleted = message.isDeleted
        )
    }

    /**
     * Map ChatRoom to ChatRoomResponse DTO
     * Note: Adjust based on your actual ChatRoomDto structure
     */
    private fun mapToChatRoomResponse(chatRoom: ChatRoom): ChatRoom {
        // This should return ChatRoomDto.ChatRoomResponse
        // Adjust based on your actual ChatRoom entity and DTO structure
        return chatRoom
    }

    /**
     * Get list of users currently typing in a room
     */
//    fun getTypingUsersInRoom(roomId: Long): List<MessageDto.TypingUser> {
//        val userIds = typingUsers[roomId] ?: return emptyList()
//        return userIds.map { userId ->
//            MessageDto.TypingUser(
//                userId = userId,
//                username = "User_$userId", // Replace it with actual username lookup
//                startedAt = System.currentTimeMillis()
//            )
//        }
//    }
//
//    /**
//     * Get read status for a message
//     */
//    fun getMessageReadStatus(messageId: Long): List<MessageDto.UserReadInfo> {
//        val readByMap = messageReadStatus[messageId] ?: return emptyList()
//        return readByMap.map { (userId, readAt) ->
//            MessageDto.UserReadInfo(
//                userId = userId,
//                username = "User_$userId", // Replace with actual username lookup
//                readAt = readAt
//            )
//        }
//    }
//
//    /**
//     * Mark a message as read by a user
//     */
//    fun markMessageAsRead(messageId: Long, userId: Long, readAt: Long = System.currentTimeMillis()) {
//        messageReadStatus.computeIfAbsent(messageId) { mutableMapOf() }[userId] = readAt
//    }
//
//    /**
//     * Check if a message has been read
//     */
//    fun isMessageRead(messageId: Long, userId: Long): Boolean {
//        return messageReadStatus[messageId]?.containsKey(userId) ?: false
//    }
//
//    /**
//     * Clear typing status for a room (useful for cleanup)
//     */
//    fun clearRoomTypingStatus(roomId: Long) {
//        typingUsers.remove(roomId)
//    }
//
//    /**
//     * Clear all read status for a message (useful for deletion)
//     */
//    fun clearMessageReadStatus(messageId: Long) {
//        messageReadStatus.remove(messageId)
//    }

}