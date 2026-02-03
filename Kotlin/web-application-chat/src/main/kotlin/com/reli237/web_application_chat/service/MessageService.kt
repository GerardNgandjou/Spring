package com.reli237.web_application_chat.service

import com.reli237.web_application_chat.dto.FileUploadDto
import com.reli237.web_application_chat.dto.MessageDto
import com.reli237.web_application_chat.dto.UserDto
import com.reli237.web_application_chat.model.ChatRoom
import com.reli237.web_application_chat.model.Message
import com.reli237.web_application_chat.model.MessageType
import com.reli237.web_application_chat.repository.ChatRoomRepository
import com.reli237.web_application_chat.repository.MessageRepository
import com.reli237.web_application_chat.repository.UsersRepository
import jakarta.persistence.EntityNotFoundException
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.util.LinkedMultiValueMap
import org.springframework.util.MultiValueMap
import org.springframework.web.client.RestTemplate
import org.springframework.web.multipart.MultipartFile
import java.time.LocalDateTime

@Service
@Transactional
class MessageService(
    private val messageRepository: MessageRepository,
    private val chatRoomRepository: ChatRoomRepository,
    private val usersRepository: UsersRepository,

    @Value("\${file.service.url:http://localhost:8080}")
    private val fileServiceUrl: String,
    private val chatFileStorageService: ChatFileStorageService


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
     * Create a message with file attachment
     */
    /**
     * Create message with file attachment
     */
    /**
     * Create message with file attachment
     */
    @Transactional
    fun createMessageWithFileAttachment(
        userId: Long,
        request: MessageDto.MessageCreateRequest,
        file: MultipartFile?
    ): MessageDto.MessageResponse {
        var fileAttachment: MessageDto.FileAttachmentDto? = null

        // Upload file if provided
        if (file != null && !file.isEmpty) {
            val fileMetadata = chatFileStorageService.uploadFile(
                userId = userId,
                file = file,
                description = "Uploaded from chat",
                chatRoomId = request.chatRoomId
            )

            fileAttachment = MessageDto.FileAttachmentDto(
                fileId = fileMetadata.id,
                fileName = fileMetadata.fileName,
                fileType = fileMetadata.fileType,
                fileSize = fileMetadata.fileSize.toLong(),
                downloadUrl = fileMetadata.downloadUrl,
                thumbnailUrl = fileMetadata.thumbnailUrl
            )
        }

        // Create message with file attachment info
        val messageRequest = if (fileAttachment != null) {
            val fileReference = "[FILE:${fileAttachment.fileName}]"
            val finalContent = if (request.content.isNotBlank()) {
                "${request.content} $fileReference"
            } else {
                "Shared a file: ${fileAttachment.fileName}"
            }

            request.copy(
                content = finalContent,
                messageType = MessageType.FILE,
                fileAttachment = fileAttachment
            )
        } else {
            request
        }

        // Create the message entity
        val messageEntity = createMessageEntity(userId, messageRequest)
        val savedMessage = messageRepository.save(messageEntity)

        // Return response with file attachment
        return mapToMessageResponse(savedMessage).copy(
            fileAttachment = fileAttachment
        )
    }

    /**
     * Get messages with file attachments for a room
     */
    fun getMessagesWithFiles(chatRoomId: Long): List<MessageDto.MessageResponse> {
        return getMessagesByChatRoom(chatRoomId).filter { message ->
            message.content.contains("[FILE:") || message.fileAttachment != null
        }
    }

    /**
     * Extract file attachments from messages
     */
    fun extractFileAttachments(messages: List<MessageDto.MessageResponse>): List<MessageDto.FileAttachmentDto> {
        return messages.mapNotNull { it.fileAttachment }
    }

    /**
     * Get download URL for file attachment
     */
    fun getFileDownloadUrl(fileId: Long): String {
        return "$fileServiceUrl/download/$fileId"
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

    private fun createMessageEntity(
        userId: Long,
        request: MessageDto.MessageCreateRequest
    ): Message {
        // Validate user
        val user = usersRepository.findById(userId)
            .orElseThrow { EntityNotFoundException("User not found with id: $userId") }

        // Validate chat room
        val chatRoom = chatRoomRepository.findById(request.chatRoomId)
            .orElseThrow { EntityNotFoundException("Chat room not found with id: ${request.chatRoomId}") }

        return Message(
            id = 0,
            content = request.content,
            sender = user,
            chatRoom = chatRoom,
            timeStamp = LocalDateTime.now(),
            messageType = request.messageType ?: MessageType.TEXT,
            isDeleted = false
        )
    }


}