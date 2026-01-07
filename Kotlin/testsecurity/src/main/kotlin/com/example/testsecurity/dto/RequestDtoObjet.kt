package com.example.testsecurity.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

// Data Transfer Object for login requests
//data class LoginRequest(
//
//    @field:NotBlank(message = "Email is required")
//    @field:Email(message = "Email should be valid")
//    val email: String,
//
//    @field:NotBlank(message = "Password is required")
//    val password: String
//)

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
    val confirmPassword: String
)

data class RefreshTokenRequest(
    @field:NotBlank
    val refreshToken: String
)

data class LogoutRequest(
    @field:NotBlank
    val refreshToken: String
)