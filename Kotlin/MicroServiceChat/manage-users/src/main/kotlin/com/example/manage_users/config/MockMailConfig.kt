package com.example.manage_users.config

import jakarta.mail.Session
import jakarta.mail.internet.MimeMessage
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.mail.SimpleMailMessage
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessagePreparator
import java.io.InputStream
import java.util.Properties

@Configuration
class MockMailConfig {

    @Bean
    @Primary
    @ConditionalOnMissingBean(JavaMailSender::class)
    fun mockJavaMailSender(): JavaMailSender {
        return MockJavaMailSender()
    }

}

class MockJavaMailSender : JavaMailSender {
    private val log = LoggerFactory.getLogger(MockJavaMailSender::class.java)
    private val session = Session.getDefaultInstance(Properties())

    override fun send(mimeMessage: MimeMessage) {
        log.info("📧 MOCK EMAIL SENT: {}", mimeMessage.subject)
    }

    override fun send(vararg mimeMessages: MimeMessage) {
        mimeMessages.forEach { send(it) }
    }

    override fun send(mimeMessagePreparator: MimeMessagePreparator) {
        val mimeMessage = createMimeMessage()
        mimeMessagePreparator.prepare(mimeMessage)
        send(mimeMessage)
        log.info("📧 MOCK EMAIL PREPARATOR SENT")
    }

    override fun send(vararg mimeMessagePreparators: MimeMessagePreparator) {
        mimeMessagePreparators.forEach { send(it) }
    }

    override fun createMimeMessage(): MimeMessage {
        return MimeMessage(session)
    }

    override fun createMimeMessage(contentStream: InputStream): MimeMessage {
        return MimeMessage(session, contentStream)
    }

    // MailSender methods
    override fun send(simpleMessage: SimpleMailMessage) {
        log.info("📧 MOCK SIMPLE EMAIL SENT to: {}, subject: {}",
            simpleMessage.to?.joinToString(), simpleMessage.subject)
    }

    override fun send(vararg simpleMessages: SimpleMailMessage) {
        simpleMessages.forEach { send(it) }
    }
}