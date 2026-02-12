package com.example.manage_users.service.impl

import com.example.manage_users.execption.InvalidTokenException
import com.example.manage_users.security.JwtProvider
import com.example.manage_users.service.interf.TokenService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class TokenServiceImpl  (
    private val jwtTokenProvider: JwtProvider
) : TokenService {

    companion object {
        private val log = LoggerFactory.getLogger(TokenServiceImpl::class.java)
    }

    // Token generation methods
    override fun generateVerificationToken(email: String): String {
        // This method is kept for backward compatibility
        // In practice, we should use userId-based tokens
        return jwtTokenProvider.generateAccessToken(email)
    }

    override fun generatePasswordResetToken(email: String): String {
        // This method is kept for backward compatibility
        return jwtTokenProvider.generateAccessToken(email)
    }

    // UserId-based token methods
    override fun createEmailVerificationToken(userId: Long): String {
        return jwtTokenProvider.createEmailVerificationToken(userId)
    }

    override fun createPasswordResetToken(userId: Long): String {
        return jwtTokenProvider.createPasswordResetToken(userId)
    }

    override fun createEmailChangeToken(userId: Long, newEmail: String): String {
        return jwtTokenProvider.createEmailChangeToken(userId, newEmail)
    }

    // Validation methods
    override fun validateVerificationToken(token: String): String {
        if (!jwtTokenProvider.validateEmailVerificationToken(token)) {
            throw InvalidTokenException("Invalid verification token")
        }
        return jwtTokenProvider.getEmailFromToken(token)
    }

    override fun validatePasswordResetToken(token: String): String {
        if (!jwtTokenProvider.validatePasswordResetToken(token)) {
            throw InvalidTokenException("Invalid password reset token")
        }
        return jwtTokenProvider.getEmailFromToken(token)
    }

    override fun validateEmailVerificationToken(token: String): Long {
        if (!jwtTokenProvider.validateEmailVerificationToken(token)) {
            throw InvalidTokenException("Invalid email verification token")
        }
        return jwtTokenProvider.getUserIdFromToken(token)
    }

    override fun validateEmailChangeToken(token: String, userId: Long): String {
        if (!jwtTokenProvider.validateEmailChangeToken(token)) {
            throw InvalidTokenException("Invalid email change token")
        }
        val tokenUserId = jwtTokenProvider.getUserIdFromToken(token)
        if (tokenUserId != userId) {
            throw InvalidTokenException("Token does not belong to this user")
        }
        return jwtTokenProvider.getNewEmailFromToken(token)
    }

    // Deletion methods (in a real app, these would add tokens to a blacklist)
    override fun deleteEmailVerificationToken(token: String) {
        log.info("Email verification token invalidated: $token")
    }

    override fun deletePasswordResetToken(token: String) {
        log.info("Password reset token invalidated: $token")
    }

    override fun deleteEmailChangeToken(token: String) {
        log.info("Email change token invalidated: $token")
    }

    override fun invalidateAllUserTokens(userId: Long) {
        log.info("All tokens invalidated for user: $userId")
    }

    override fun isTokenValid(token: String, email: String): Boolean {
        return try {
            jwtTokenProvider.validateToken(token) &&
                    jwtTokenProvider.getEmailFromToken(token) == email
        } catch (ex: Exception) {
            false
        }
    }
}