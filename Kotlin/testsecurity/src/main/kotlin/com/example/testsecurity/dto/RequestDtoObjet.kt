package com.example.testsecurity.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class LoginRequest(
    @field:Email
    @field:NotBlank
    val email: String,

    @field:NotBlank
    @field:Size(min = 8, max = 100)
    val password: String
)

data class RegistrationRequest(
    @field:Email
    @field:NotBlank
    val email: String,

    @field:NotBlank
    @field:Size(min = 8, max = 100)
    val password: String,

    @field:NotBlank
    @field:Size(min = 8, max = 100)
    val confirmPassword: String,

    val roles: Set<String>? = null  // Optional: allow specifying roles during registration
)

data class RefreshTokenRequest(
    @field:NotBlank
    val refreshToken: String
)

data class LogoutRequest(
    @field:NotBlank
    val refreshToken: String
)