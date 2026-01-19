package com.reli237.web_application_chat.service

import com.reli237.web_application_chat.dto.MessageDto
import com.reli237.web_application_chat.dto.UserDto
import com.reli237.web_application_chat.model.ChatRoom
import com.reli237.web_application_chat.model.Message
import com.reli237.web_application_chat.model.MessageType
import com.reli237.web_application_chat.repository.ChatRoomRepository
import com.reli237.web_application_chat.repository.MessageRepository
import com.reli237.web_application_chat.repository.UsersRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class MessageService(
    private val messageRepository: MessageRepository,
    private val chatRoomRepository: ChatRoomRepository,
    private val usersRepository: UsersRepository
) {

    /**
     * Create a new message in a chat room
     */
    fun createMessage(senderId: Long, request: MessageDto.MessageCreateRequest): MessageDto.MessageResponse {
        val sender = usersRepository.findById(senderId)
            .orElseThrow { throw IllegalArgumentException("Sender not found with id: $senderId") }

        val chatRoom = chatRoomRepository.findById(request.chatRoomId)
            .orElseThrow { throw IllegalArgumentException("Chat room not found with id: ${request.chatRoomId}") }

        if (request.content.isBlank()) {
            throw IllegalArgumentException("Message content cannot be empty")
        }

        val message = Message(
            id = 0,
            content = request.content,
            sender = sender,
            chatRoom = chatRoom,
            timeStamp = LocalDateTime.now(),
            messageType = request.messageType,
            isDeleted = false
        )

        val savedMessage = messageRepository.save(message)
        return mapToMessageResponse(savedMessage)
    }

    /**
     * Get message by ID
     */
    fun getMessageById(id: Long): MessageDto.MessageDetailResponse {
        val message = messageRepository.findById(id)
            .orElseThrow { throw IllegalArgumentException("Message not found with id: $id") }

        if (message.isDeleted) {
            throw IllegalStateException("Message has been deleted")
        }

        return mapToMessageDetailResponse(message)
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

}