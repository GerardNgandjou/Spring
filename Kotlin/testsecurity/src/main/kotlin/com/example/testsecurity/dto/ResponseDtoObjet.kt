package com.example.testsecurity.dto

import java.time.Instant

data class AuthResponse(
    val accessToken: String,
    val refreshToken: String? = null,
    val tokenType: String = "Bearer",
    val expiresIn: Long? = null,
    val user: UserProfileResponse? = null  // Optional: include user info in auth response
)

data class UserResponse(
    val id: Long,  // Changed from String to Long to match User.id type
    val email: String,
    val roles: List<String>,  // Changed to return full role objects
    val enabled: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant  // Added to include all user fields
)

data class UserProfileResponse(
    val id: Long,  // Changed from String to Long
    val email: String,
    val roles: List<String>  // Role names for simple profile view
)

data class RoleResponse(
    val id: String,  // UUID as String
    val name: String,
    val createdAt: Instant
)
