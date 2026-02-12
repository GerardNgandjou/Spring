package com.example.manage_users.service.interf

interface TokenService {

    fun generateVerificationToken(email: String): String
    fun validateVerificationToken(token: String): String
    fun generatePasswordResetToken(email: String): String
    fun validatePasswordResetToken(token: String): String
    fun invalidateAllUserTokens(userId: Long)
    fun isTokenValid(token: String, email: String): Boolean

}