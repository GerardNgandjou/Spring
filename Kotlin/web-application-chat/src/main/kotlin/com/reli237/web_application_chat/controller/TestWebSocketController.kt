package com.reli237.web_application_chat.controller

import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.messaging.simp.SimpMessageHeaderAccessor
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.RestController


@RestController
@RequestMapping("/api/test")
class TestWebSocketController(
    private val messagingTemplate: SimpMessagingTemplate
) {

    private val logger = LoggerFactory.getLogger(TestWebSocketController::class.java)


    @GetMapping("/broadcast/{roomId}")
    fun broadcastTest(@PathVariable roomId: Long): ResponseEntity<String> {
        val testMessage = mapOf(
            "type" to "TEST",
            "message" to "Ceci est un message de test",
            "timestamp" to System.currentTimeMillis()
        )

        messagingTemplate.convertAndSend("/topic/room/$roomId", testMessage)

        return ResponseEntity.ok("Message de test envoyé à la salle $roomId")
    }

    @GetMapping("/status")
    fun getWebSocketStatus(): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.ok(mapOf(
            "status" to "WebSocket actif",
            "timestamp" to System.currentTimeMillis()
        ))
    }

    @MessageMapping("/debug.connect")
    fun handleConnect(@Payload data: Map<String, Any>, headerAccessor: SimpMessageHeaderAccessor) {
        val userId = data["userId"] as? Long
        val sessionId = headerAccessor.sessionId

        logger.info("🔗 WebSocket connect attempt - UserId: $userId, SessionId: $sessionId")
        logger.info("Headers: ${headerAccessor.toMap()}")

        // Envoyer une réponse de test
        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/debug",
            mapOf(
                "type" to "CONNECT_SUCCESS",
                "message" to "Connecté avec succès",
                "userId" to userId,
                "sessionId" to sessionId,
                "timestamp" to System.currentTimeMillis()
            )
        )
    }

    @GetMapping("/api/ws/debug")
    @ResponseBody
    fun debugInfo(): Map<String, Any> {
        return mapOf(
            "status" to "OK",
            "endpoints" to listOf(
                "/ws-chat",
                "/app/chat.sendMessage/{roomId}",
                "/app/chat.addUser/{roomId}",
                "/app/chat.typing/{roomId}",
                "/topic/room/{roomId}",
                "/topic/room/{roomId}/typing"
            ),
            "timestamp" to System.currentTimeMillis()
        )
    }

}