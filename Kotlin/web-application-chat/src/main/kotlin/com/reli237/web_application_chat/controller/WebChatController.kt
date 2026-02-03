package com.reli237.web_application_chat.controller

import com.reli237.web_application_chat.dto.MessageDto
import com.reli237.web_application_chat.dto.PrivateDto
import com.reli237.web_application_chat.repository.UsersRepository
import com.reli237.web_application_chat.service.ChatRoomService
import com.reli237.web_application_chat.service.MessageService
import com.reli237.web_application_chat.service.PrivateChatService
import org.slf4j.LoggerFactory
import org.springframework.messaging.handler.annotation.DestinationVariable
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.messaging.handler.annotation.SendTo
import org.springframework.messaging.simp.SimpMessageHeaderAccessor
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.messaging.simp.annotation.SendToUser
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.stereotype.Controller
import java.security.Principal
import java.time.LocalDateTime

@Controller
class WebChatController(
    private val messageService: MessageService,
    private val messagingTemplate: SimpMessagingTemplate,
    private val privateChatService: PrivateChatService,
    private val usersRepository: UsersRepository
) {

    private val logger = LoggerFactory.getLogger(this::class.java)

    /**
     * Envoyer un message à une salle de chat spécifique
     * Le message est diffusé à TOUS les utilisateurs abonnés à la salle
     * ET à l'émetteur lui-même
     *
     * Endpoint pour envoyer un message WebSocket
     *
     * @param roomId ID du salon
     * @param messageRequest Requête contenant le contenu du message
     * @param headerAccessor Accesseur des headers STOMP pour récupérer l'utilisateur
     */
    // ==================== SEND MESSAGE ====================

    /**
     * Endpoint pour envoyer un message WebSocket
     *
     * ✅ IMPORTANT: Récupère l'userId depuis la session (stocké par AuthInterceptor)
     *
     * @param roomId ID du salon
     * @param messageRequest Requête contenant le contenu du message
     * @param headerAccessor Accesseur des headers STOMP pour récupérer les infos
     */
    @MessageMapping("/chat.sendMessage/{roomId}")
    fun sendMessage(
        @DestinationVariable roomId: Long,
        @Payload messageRequest: MessageDto.MessageCreateRequest,
        headerAccessor: SimpMessageHeaderAccessor
    ) {
        println("\n🔥🔥🔥 ===== WEBSOCKET MESSAGE RECEIVED ===== 🔥🔥🔥")
        println("📍 Room ID: $roomId")
        println("📝 Content: ${messageRequest.content}")
        println("🆔 Session ID: ${headerAccessor.sessionId}")

        // ==================== RÉCUPÉRER L'UTILISATEUR ====================

        // ✅ IMPORTANT: L'userId a été stocké en session par AuthInterceptor
        val sessionAttributes = headerAccessor.sessionAttributes
        println("📋 Session attributes keys: ${sessionAttributes?.keys}")

        val userId = sessionAttributes?.get("userId") as? Long

        println("👤 User ID from session: $userId")

        // ==================== VALIDER L'UTILISATEUR ====================

        if (userId == null) {
            println("❌ Utilisateur non authentifié!")
            println("❌ Vérifier que AuthInterceptor a stocké userId en session!")

            // Envoyer une erreur à l'utilisateur
            try {
                messagingTemplate.convertAndSendToUser(
                    headerAccessor.sessionId ?: "unknown",
                    "/queue/errors",
                    MessageError(
                        code = "NOT_AUTHENTICATED",
                        message = "Utilisateur non authentifié - userId not found in session"
                    )
                )
            } catch (e: Exception) {
                println("❌ Impossible d'envoyer l'erreur: ${e.message}")
            }
            return
        }

        println("✅ Utilisateur authentifié (ID: $userId)")

        // ==================== CRÉER LE MESSAGE ====================

        try {
            // Ajouter le roomId à la requête
            messageRequest.chatRoomId = roomId

            println("💾 Création du message en base de données...")
            println("   - Room: $roomId")
            println("   - User: $userId")
            println("   - Content: ${messageRequest.content}")

            // Créer et sauvegarder le message en base de données
            val messageResponse = messageService.createMessage(userId, messageRequest)

            println("✅ Message créé avec l'ID: ${messageResponse.id}")
            println("⏰ Timestamp: ${messageResponse.timestamp}")

            // ==================== BROADCAST LE MESSAGE ====================

            println("📤 Envoi du message à /topic/room/$roomId")

            // 1️⃣ ENVOYER LE MESSAGE À TOUS LES UTILISATEURS DE LA SALLE
            // (y compris l'émetteur s'il est abonné)
            messagingTemplate.convertAndSend(
                "/topic/room/$roomId",
                MessageEvent(
                    type = "NEW_MESSAGE",
                    message = messageResponse
                )
            )

            println("✅ Message broadcasté à /topic/room/$roomId")

            // 2️⃣ ENVOYER UNE CONFIRMATION À L'ÉMETTEUR
            println("✅ Envoi de la confirmation à l'utilisateur $userId")

            try {
                messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/messages/confirmation",
                    MessageConfirmation(
                        messageId = messageResponse.id,
                        status = "SENT",
                        content = "Message envoyé avec succès"
                    )
                )
                println("✅ Confirmation envoyée")
            } catch (e: Exception) {
                println("⚠️ Impossible d'envoyer la confirmation: ${e.message}")
            }

            println("🔥🔥🔥 ===== MESSAGE SENT SUCCESSFULLY ===== 🔥🔥🔥\n")

        } catch (e: Exception) {
            println("❌ Erreur lors de la création du message: ${e.message}")
            println("📋 Stack trace:")
            e.printStackTrace()

            // Envoyer l'erreur à l'utilisateur
            try {
                messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/errors",
                    MessageError(
                        code = "MESSAGE_CREATION_ERROR",
                        message = "Erreur lors de la création du message: ${e.message}"
                    )
                )
            } catch (sendError: Exception) {
                println("❌ Impossible d'envoyer l'erreur à l'utilisateur: ${sendError.message}")
            }
        }
    }

    // ==================== TYPING NOTIFICATION ====================

    /**
     * Endpoint pour envoyer une notification de frappe
     *
     * @param roomId ID du salon
     * @param typingNotification Notification contenant userId et isTyping
     */
    @MessageMapping("/chat.typing/{roomId}")
    fun typing(
        @DestinationVariable roomId: Long,
        @Payload typingNotification: TypingNotificationDto,
        headerAccessor: SimpMessageHeaderAccessor
    ) {
        println("⌨️ Utilisateur ${typingNotification.userId} tape dans la salle $roomId: ${typingNotification.isTyping}")

        // Envoyer la notification à tous les utilisateurs de la salle
        try {
            messagingTemplate.convertAndSend(
                "/topic/room/$roomId/typing",
                typingNotification
            )
            println("✅ Typing notification broadcastée")
        } catch (e: Exception) {
            println("❌ Erreur lors de l'envoi de la notification de frappe: ${e.message}")
        }
    }

    // ==================== USER JOIN/LEAVE ====================

    /**
     * Notifier quand un utilisateur rejoint une salle
     */
    @MessageMapping("/chat.join/{roomId}")
    fun joinRoom(
        @DestinationVariable roomId: Long,
        headerAccessor: SimpMessageHeaderAccessor
    ) {
        val sessionAttributes = headerAccessor.sessionAttributes
        val userId = sessionAttributes?.get("userId") as? Long

        if (userId != null) {
            println("👋 Utilisateur $userId a rejoint la salle $roomId")

            try {
                messagingTemplate.convertAndSend(
                    "/topic/room/$roomId/activity",
                    UserActivityDto(
                        type = "USER_JOINED",
                        userId = userId,
                        username = "User $userId",
                        roomId = roomId
                    )
                )
                println("✅ Activity notification envoyée")
            } catch (e: Exception) {
                println("❌ Erreur lors de l'envoi de l'activité: ${e.message}")
            }
        } else {
            println("⚠️ userId null - impossible de notifier join")
        }
    }

    /**
     * Notifier quand un utilisateur quitte une salle
     */
    @MessageMapping("/chat.leave/{roomId}")
    fun leaveRoom(
        @DestinationVariable roomId: Long,
        headerAccessor: SimpMessageHeaderAccessor
    ) {
        val sessionAttributes = headerAccessor.sessionAttributes
        val userId = sessionAttributes?.get("userId") as? Long

        if (userId != null) {
            println("👋 Utilisateur $userId a quitté la salle $roomId")

            try {
                messagingTemplate.convertAndSend(
                    "/topic/room/$roomId/activity",
                    UserActivityDto(
                        type = "USER_LEFT",
                        userId = userId,
                        username = "User $userId",
                        roomId = roomId
                    )
                )
                println("✅ Activity notification envoyée")
            } catch (e: Exception) {
                println("❌ Erreur lors de l'envoi de l'activité: ${e.message}")
            }
        }
    }

    // ==================== ERROR HANDLING ====================

    @MessageMapping("/error")
    fun handleError(
        @Payload error: MessageError,
        headerAccessor: SimpMessageHeaderAccessor
    ) {
        println("❌ Erreur reçue: ${error.code} - ${error.message}")
    }

    /**
     * Ajouter un utilisateur à la salle (notification)
     */
    @MessageMapping("/chat.addUser/{roomId}")
    fun addUser(
        @DestinationVariable roomId: Long,
        @Payload userId: Long,
        headerAccessor: SimpMessageHeaderAccessor
    ) {
        println("👤 Utilisateur $userId rejoint la salle $roomId")

        val username = headerAccessor.user?.name ?: "Anonymous"
        println("👤 Username: $username")

        // Notifier tous les utilisateurs de la salle
        messagingTemplate.convertAndSend(
            "/topic/room/$roomId/users",
            UserEvent(
                type = "USER_JOINED",
                userId = userId,
                username = username,
                action = "joined the chat"
            )
        )
    }

    /**
     * Message privé entre utilisateurs
     */
    @MessageMapping("/chat.private")
    @SendToUser("/queue/private")
    fun sendPrivateMessage(
        @Payload privateMessageRequest: PrivateMessageRequest,
        principal: Principal
    ): PrivateMessageResponse {
        val senderId = principal.name.toLong()
        println("🔒 Message privé de $senderId à ${privateMessageRequest.recipientId}")

        // Envoyer au destinataire
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

        // Retourner une confirmation à l'émetteur
        return PrivateMessageResponse(
            senderId = senderId,
            recipientId = privateMessageRequest.recipientId,
            content = privateMessageRequest.content,
            timestamp = System.currentTimeMillis(),
            status = "sent"
        )
    }

    /**
     * Notifier que le message a été lu
     */
    @MessageMapping("/chat.message.read/{messageId}")
    fun messageRead(
        @DestinationVariable messageId: Long,
        @Payload readByUserId: Long,
        principal: Principal
    ) {
        val senderId = principal.name.toLong()
        println("👁️ Message $messageId lu par $readByUserId")

        // Notifier l'émetteur original que son message a été lu
        messagingTemplate.convertAndSendToUser(
            senderId.toString(),
            "/queue/messages/read",
            MessageReadNotification(messageId, readByUserId, System.currentTimeMillis())
        )
    }

    //============= Endpoints WebSocket OneToOne Conversation  ===============

    @MessageMapping("/private/send/{senderId}")
    @SendToUser("/queue/private/confirmation")
    fun sendPrivateMessage(
        @DestinationVariable senderId: Long,
        @Payload request: PrivateDto.PrivateChatRequest,
        headerAccessor: SimpMessageHeaderAccessor
    ): PrivateChatService.PrivateChatNotification {
        // Envoyer le message via le service
        val response = privateChatService.sendMessage(senderId, request)

        // Retourner la confirmation à l'expéditeur
        return PrivateChatService.PrivateChatNotification(
            messageId = response.id,
            senderId = response.senderId1,
            senderName = response.senderName1,
            content = response.content,
            timestamp = response.timestamp,
            isOwnMessage = true
        )
    }

    @MessageMapping("/private/typing/{senderId}/{receiverId}")
    fun handleTypingIndicator(
        @DestinationVariable senderId: Long,
        @DestinationVariable receiverId: Long,
        @Payload isTyping: Boolean
    ) {
        // Vérifier si l'utilisateur existe
        val sender = usersRepository.findById(senderId).orElse(null)
        if (sender == null) {
            logger.warn("Sender with ID $senderId not found")
            return
        }

        // Vérifier si le destinataire existe
        val receiver = usersRepository.findById(receiverId).orElse(null)
        if (receiver == null) {
            logger.warn("Receiver with ID $receiverId not found")
            return
        }

        // Créer la notification de frappe
        val typingNotification = PrivateDto.TypingNotification(
            senderId = senderId,
            senderName = sender.email,
            receiverId = receiverId,
            isTyping = isTyping,
            timestamp = LocalDateTime.now()
        )

        // Envoyer la notification au destinataire uniquement
        messagingTemplate.convertAndSend(
            "/topic/private/typing/${receiverId}",
            typingNotification
        )

        // Log pour le débogage
        if (isTyping) {
            logger.info("User $senderId is typing to $receiverId")
        } else {
            logger.info("User $senderId stopped typing to $receiverId")
        }
    }

    @MessageMapping("/private/read/{userId}")
    fun markMessagesAsRead(
        @DestinationVariable userId: Long,
        @Payload messageIds: List<Long>
    ) {
        val request = PrivateDto.MarkAsReadRequest(messageIds = messageIds)
        privateChatService.markMessagesAsRead(userId, request)
    }

    /**
     * Handle file upload via WebSocket
     * This is for small files only (WebSocket has message size limits)
     */
    @MessageMapping("/chat.room.{roomId}.files.upload")
    fun handleFileUpload(
        @DestinationVariable roomId: Long,
        @Payload fileUpload: FileUploadDto,
        @Header("userId") userId: Long,
        principal: Principal
    ) {
        // Validate file data
        if (fileUpload.fileData.isNullOrEmpty()) {
            sendError(userId, "File data is empty")
            return
        }

        // In a real implementation, you would:
        // 1. Save file data temporarily
        // 2. Forward to file service via REST
        // 3. Get file metadata back
        // 4. Create message with file reference

        // For now, simulate file upload
        val simulatedFileId = System.currentTimeMillis()

        // Create notification
        val fileNotification = FileUploadDto.FileUploadNotification(
            uploadId = simulatedFileId,
            fileName = fileUpload.fileName,
            fileSize = fileUpload.fileData.length.toLong(),
            fileType = fileUpload.fileType,
            uploadedBy = userId,
            roomId = roomId,
            timestamp = LocalDateTime.now(),
            status = "COMPLETED",
            downloadUrl = "/api/chat/files/download/$simulatedFileId"
        )

        // Notify all users in the room
        messagingTemplate.convertAndSend(
            "/topic/room.$roomId.files",
            fileNotification
        )

        // Notify the uploader specifically
        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/files.upload",
            fileNotification
        )

        // Create a chat message about the file
        val messageContent = "[FILE UPLOADED] ${fileUpload.fileName}"
        val messageRequest = MessageDto.MessageCreateRequest(
            content = messageContent,
            chatRoomId = roomId,
            messageType = MessageDto.MessageType.FILE
        )

        // You would call messageService.createMessage here
        // For now, just send a notification
        val messageNotification = mapOf(
            "type" to "FILE_UPLOAD",
            "fileName" to fileUpload.fileName,
            "uploaderId" to userId,
            "timestamp" to System.currentTimeMillis(),
            "downloadUrl" to "/api/chat/files/download/$simulatedFileId"
        )

        messagingTemplate.convertAndSend(
            "/topic/room.$roomId.messages",
            messageNotification
        )
    }

    /**
     * Subscribe to file upload notifications for a room
     */
    @SubscribeMapping("/topic/room.{roomId}.files")
    fun subscribeToRoomFiles(@DestinationVariable roomId: Long): String {
        return "Subscribed to file notifications for room $roomId"
    }

    /**
     * Request file download via WebSocket
     */
    @MessageMapping("/chat.files.download.request")
    fun handleFileDownloadRequest(
        @Payload request: FileUploadDto.FileDownloadRequest,
        principal: Principal
    ) {
        val fileId = request.fileId
        val userId = principal.name.toLongOrNull() ?: 0L

        // In a real implementation, you would:
        // 1. Check if user has permission to download
        // 2. Get file metadata from file service
        // 3. Generate download URL/token

        val downloadInfo = FileUploadDto.FileDownloadResponse(
            fileId = fileId,
            fileName = "file_$fileId.pdf", // Example
            fileSize = 1024L, // Example size
            downloadUrl = "/api/chat/files/download/$fileId",
            expiresAt = LocalDateTime.now().plusHours(1),
            requiresAuth = true
        )

        // Send download info to requesting user
        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/files.download",
            downloadInfo
        )
    }

    /**
     * Get file upload progress
     */
    @MessageMapping("/chat.files.upload.progress")
    fun getUploadProgress(
        @Payload request: FileUploadDto.UploadProgressRequest,
        principal: Principal
    ) {
        val uploadId = request.uploadId
        val userId = principal.name.toLongOrNull() ?: 0L

        // In a real implementation, you would track upload progress
        val progress = FileUploadDto.UploadProgressResponse(
            uploadId = uploadId,
            progress = 50, // Example: 50% complete
            bytesUploaded = 512,
            totalBytes = 1024,
            estimatedTimeRemaining = 30 // seconds
        )

        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/files.progress",
            progress
        )
    }

    /**
     * Cancel file upload
     */
    @MessageMapping("/chat.files.upload.cancel")
    fun cancelFileUpload(
        @Payload request: FileUploadDto.CancelUploadRequest,
        principal: Principal
    ) {
        val uploadId = request.uploadId
        val userId = principal.name.toLongOrNull() ?: 0L

        // In a real implementation, you would cancel the upload process

        val cancellation = mapOf(
            "uploadId" to uploadId,
            "cancelled" to true,
            "timestamp" to System.currentTimeMillis()
        )

        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/files.cancelled",
            cancellation
        )
    }

    private fun sendError(userId: Long, message: String) {
        val error = mapOf(
            "error" to true,
            "message" to message,
            "timestamp" to System.currentTimeMillis()
        )

        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/errors",
            error
        )
    }

    // ==================== DATA CLASSES ====================

    /**
     * Événement de message (pour la diffusion publique)
     */
    data class MessageEvent(
        val type: String,
        val message: MessageDto.MessageResponse,
        val timestamp: Long = System.currentTimeMillis()
    )

    /**
     * Confirmation d'envoi de message
     */
    data class MessageConfirmation(
        val messageId: Long,
        val status: String,
        val content: String
    )

    /**
     * Erreur WebSocket
     */
    data class MessageError(
        val code: String,
        val message: String,
        val timestamp: Long = System.currentTimeMillis()
    )

    /**
     * Événement utilisateur (join/leave)
     */
    data class UserEvent(
        val type: String,
        val userId: Long,
        val username: String,
        val action: String,
        val timestamp: Long = System.currentTimeMillis()
    )

    /**
     * Demande de saisie
     */
    data class TypingRequest(
        val userId: Long,
        val isTyping: Boolean
    )

    /**
     * Notification de saisie
     */
    data class TypingNotification(
        val userId: Long,
        val isTyping: Boolean,
        val timestamp: Long = System.currentTimeMillis()
    )

    /**
     * Demande de message privé
     */
    data class PrivateMessageRequest(
        val recipientId: Long,
        val content: String
    )

    /**
     * Réponse de message privé
     */
    data class PrivateMessageResponse(
        val senderId: Long,
        val recipientId: Long,
        val content: String,
        val timestamp: Long,
        val status: String = "received"
    )

    /**
     * Notification de lecture
     */
    data class MessageReadNotification(
        val messageId: Long,
        val readByUserId: Long,
        val readAt: Long
    )

    data class TypingNotificationDto(
        val userId: Long,
        val isTyping: Boolean,
        val roomId: Long? = null
    )

    data class UserActivityDto(
        val type: String, // USER_JOINED, USER_LEFT
        val userId: Long,
        val username: String?,
        val roomId: Long
    )

}