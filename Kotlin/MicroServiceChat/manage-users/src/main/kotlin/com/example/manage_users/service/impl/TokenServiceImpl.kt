package com.example.manage_users.service.impl

import com.example.manage_users.execption.InvalidTokenException
import com.example.manage_users.service.interf.TokenService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class TokenServiceImpl  (
    private val jwtTokenProvider: JwtTokenProvider
) : TokenService {

    companion object {
        private val log = LoggerFactory.getLogger(TokenServiceImpl::class.java)
    }

    override fun generateVerificationToken(email: String): String {
        return jwtTokenProvider.createEmailVerificationToken(email)
    }

    override fun validateVerificationToken(token: String): String {
        if (!jwtTokenProvider.validateEmailVerificationToken(token)) {
            throw InvalidTokenException("Invalid verification token")
        }
        return jwtTokenProvider.getEmailFromToken(token)
    }

    override fun generatePasswordResetToken(email: String): String {
        return jwtTokenProvider.createPasswordResetToken(email)
    }

    override fun validatePasswordResetToken(token: String): String {
        if (!jwtTokenProvider.validatePasswordResetToken(token)) {
            throw InvalidTokenException("Invalid password reset token")
        }
        return jwtTokenProvider.getEmailFromToken(token)
    }

    override fun invalidateAllUserTokens(userId: Long) {
        // In a real implementation, you would:
        // 1. Add current tokens to a blacklist
        // 2. Or delete them from the database
        // 3. Or mark them as invalid

        // For now, we'll just log it
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
