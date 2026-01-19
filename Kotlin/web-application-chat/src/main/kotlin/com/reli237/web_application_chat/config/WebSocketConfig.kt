package com.reli237.web_application_chat.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.scheduling.TaskScheduler
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker
import org.springframework.web.socket.config.annotation.StompEndpointRegistry
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer
@Configuration
@EnableWebSocketMessageBroker
@EnableScheduling
class WebSocketConfig : WebSocketMessageBrokerConfigurer {

    /**
     * Configure STOMP endpoints for WebSocket connections
     */
    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        registry.addEndpoint("/ws-chat")
            .setAllowedOrigins("*")
            .withSockJS()

        registry.addEndpoint("/ws-chat")
            .setAllowedOrigins("*")
    }

    /**
     * Configure message broker for handling messages
     */
    override fun configureMessageBroker(config: MessageBrokerRegistry) {
        // Enable a simple message broker with /topic and /queue destinations
        config.enableSimpleBroker("/topic", "/queue")
            .setHeartbeatValue(longArrayOf(10000, 10000))
            .setTaskScheduler(taskScheduler())

        // Set the prefix for messages sent to the server
        config.setApplicationDestinationPrefixes("/app")

        // Set the prefix for user-specific destinations
        config.setUserDestinationPrefix("/user")
    }

    /**
     * Create a TaskScheduler bean for WebSocket heartbeat
     */
    @Bean
    fun taskScheduler(): TaskScheduler {
        val scheduler = ThreadPoolTaskScheduler()
        scheduler.poolSize = 1
//        scheduler.threadNamePrefix = "ws-heartbeat-"
        scheduler.initialize()
        return scheduler
    }
}