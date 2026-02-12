package com.example.manage_users.service.impl

import com.example.manage_users.models.Users
import com.example.manage_users.service.interf.EmailService
import jakarta.mail.internet.MimeMessage
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.scheduling.annotation.Async
import org.thymeleaf.TemplateEngine
import org.thymeleaf.context.Context
import org.springframework.stereotype.Service

@Service
class EmailServiceImpl (
    private val mailSender: JavaMailSender,
    private val templateEngine: TemplateEngine,
    private val jwtTokenProvider: JwtTokenProvider,
    @Value("\${app.base-url:http://localhost:8080}")
    private val baseUrl: String,
    @Value("\${app.email.from:support@example.com}")
    private val fromEmail: String
) : EmailService {

    companion object {
        private val log = LoggerFactory.getLogger(EmailServiceImpl::class.java)
    }

    @Async
    override fun sendEmailVerification(user: Users) {
        try {
            val token = jwtTokenProvider.createEmailVerificationToken(user.email)
            val verificationUrl = "$baseUrl/api/v1/auth/verify-email?token=$token"

            val context = Context().apply {
                setVariable("user", user)
                setVariable("verificationUrl", verificationUrl)
            }

            val content = templateEngine.process("email/email-verification", context)

            sendEmail(
                to = user.email,
                subject = "Vérification de votre adresse email",
                content = content
            )

            log.info("Verification email sent to: ${user.email}")
        } catch (ex: Exception) {
            log.error("Failed to send verification email to ${user.email}", ex)
        }
    }

    @Async
    override fun sendPasswordResetEmail(user: Users) {
        try {
            val token = jwtTokenProvider.createPasswordResetToken(user.email)
            val resetUrl = "$baseUrl/api/v1/auth/reset-password?token=$token"

            val context = Context().apply {
                setVariable("user", user)
                setVariable("resetUrl", resetUrl)
            }

            val content = templateEngine.process("email/password-reset", context)

            sendEmail(
                to = user.email,
                subject = "Réinitialisation de votre mot de passe",
                content = content
            )

            log.info("Password reset email sent to: ${user.email}")
        } catch (ex: Exception) {
            log.error("Failed to send password reset email to ${user.email}", ex)
        }
    }

    @Async
    override fun sendAccountLockedNotification(user: Users) {
        try {
            val context = Context().apply {
                setVariable("user", user)
                setVariable("supportEmail", "support@example.com")
            }

            val content = templateEngine.process("email/account-locked", context)

            sendEmail(
                to = user.email,
                subject = "Votre compte a été verrouillé",
                content = content
            )

            log.info("Account locked notification sent to: ${user.email}")
        } catch (ex: Exception) {
            log.error("Failed to send account locked notification to ${user.email}", ex)
        }
    }

    @Async
    override fun sendWelcomeEmail(user: Users) {
        try {
            val context = Context().apply {
                setVariable("user", user)
                setVariable("loginUrl", "$baseUrl/login")
            }

            val content = templateEngine.process("email/welcome", context)

            sendEmail(
                to = user.email,
                subject = "Bienvenue sur notre plateforme",
                content = content
            )

            log.info("Welcome email sent to: ${user.email}")
        } catch (ex: Exception) {
            log.error("Failed to send welcome email to ${user.email}", ex)
        }
    }

    @Async
    override fun sendEmailChangedNotification(user: Users, oldEmail: String) {
        try {
            val context = Context().apply {
                setVariable("user", user)
                setVariable("oldEmail", oldEmail)
                setVariable("newEmail", user.email)
            }

            val content = templateEngine.process("email/email-changed", context)

            // Send to old email
            sendEmail(
                to = oldEmail,
                subject = "Votre adresse email a été modifiée",
                content = templateEngine.process("email/email-changed-old", context)
            )

            // Send to new email
            sendEmail(
                to = user.email,
                subject = "Confirmation de changement d'adresse email",
                content = content
            )

            log.info("Email changed notifications sent")
        } catch (ex: Exception) {
            log.error("Failed to send email changed notifications", ex)
        }
    }

    private fun sendEmail(to: String, subject: String, content: String) {
        val message: MimeMessage = mailSender.createMimeMessage()
        val helper = MimeMessageHelper(message, true, "UTF-8")

        helper.setFrom(fromEmail)
        helper.setTo(to)
        helper.setSubject(subject)
        helper.setText(content, true)

        mailSender.send(message)
    }
}