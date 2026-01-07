package com.example.testsecurity.dto

import java.time.Instant

data class AuthResponse(
    val accessToken: String,
    val refreshToken: String? = null,
    val tokenType: String = "Bearer",
    val expiresIn: Long? = null
)

data class UserResponse(
    val id: String,
    val email: String,
    val roles: List<String>,
    val enabled: Boolean,
    val createdAt: Instant
)

data class UserProfileResponse(
    val id: String,
    val email: String,
    val roles: List<String>
)