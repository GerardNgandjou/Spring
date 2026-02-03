package com.reli237.apigateway

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDateTime

@RestController
@RequestMapping("/fallback")
class FallbackController {

    @GetMapping("/file-service")
    fun fileServiceFallback(): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(mapOf(
                "success" to false,
                "message" to "File service is temporarily unavailable",
                "timestamp" to LocalDateTime.now(),
                "service" to "file-service",
                "suggestion" to "Please try again later or contact support"
            ))
    }

    @GetMapping("/chat-service")
    fun chatServiceFallback(): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(mapOf(
                "success" to false,
                "message" to "Chat service is temporarily unavailable",
                "timestamp" to LocalDateTime.now(),
                "service" to "chat-service",
                "suggestion" to "Please try again later"
            ))
    }
}