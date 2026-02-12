package com.example.manage_users.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.JavaMailSenderImpl

@Configuration
class MailConfiguration {

    @Value("\${spring.mail.host:}")
    private lateinit var host: String

    @Value("\${spring.mail.port:587}")
    private var port: Int = 587

    @Value("\${spring.mail.username:}")
    private lateinit var username: String

    @Value("\${spring.mail.password:}")
    private lateinit var password: String

    @Value("\${spring.mail.protocol:smtp}")
    private lateinit var protocol: String

    @Bean
    fun javaMailSender(): JavaMailSender {
        val mailSender = JavaMailSenderImpl()

        // Only configure if host is provided
        if (this::host.isInitialized && host.isNotBlank()) {
            mailSender.host = host
            mailSender.port = port
            mailSender.username = username
            mailSender.password = password
            mailSender.protocol = protocol

            val props = mailSender.javaMailProperties
            props["mail.smtp.auth"] = "true"
            props["mail.smtp.starttls.enable"] = "true"
            props["mail.debug"] = "true"
            props["mail.smtp.connectiontimeout"] = "5000"
            props["mail.smtp.timeout"] = "5000"
            props["mail.smtp.writetimeout"] = "5000"
        }

        return mailSender
    }

}