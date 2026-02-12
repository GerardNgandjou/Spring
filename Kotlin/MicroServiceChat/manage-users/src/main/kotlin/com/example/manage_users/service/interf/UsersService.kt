package com.example.manage_users.service.interf

import com.example.manage_users.dto.AdminDto
import com.example.manage_users.dto.EmailPwdDto
import com.example.manage_users.dto.ProfileDto
import com.example.manage_users.dto.RegistrationDto
import com.example.manage_users.dto.StatisticsDto
import com.example.manage_users.models.Users
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.security.core.userdetails.UserDetailsService

interface UsersService : UserDetailsService {

    // Authentication
    fun register(request: RegistrationDto.RegisterRequest): RegistrationDto.RegisterResponse
    fun authenticate(request: RegistrationDto.LoginRequest): RegistrationDto.LoginResponse
    fun refreshToken(request: RegistrationDto.RefreshTokenRequest): RegistrationDto.TokenResponse
    fun logout(userId: Long, token: String)

    // User Profile
    fun getUserProfile(userId: Long): ProfileDto.UserProfileResponse
    fun updateUserProfile(userId: Long, request: ProfileDto.UserProfileUpdateRequest): ProfileDto.UserProfileResponse
    fun updateUserPreferences(userId: Long, request: ProfileDto.UserPreferencesUpdateRequest): ProfileDto.UserProfileResponse
    fun changePassword(userId: Long, request: ProfileDto.PasswordChangeRequest)
    fun updateEmail(userId: Long, request: ProfileDto.EmailUpdateRequest)

    // Email Verification
    fun verifyEmail(token: String)
    fun resendVerificationEmail(request: EmailPwdDto.ResendVerificationEmailRequest)

    // Password Reset
    fun forgotPassword(request: EmailPwdDto.ForgotPasswordRequest)
    fun resetPassword(request: EmailPwdDto.ResetPasswordRequest)

    // Admin Operations
    fun getAllUsers(pageable: Pageable): Page<AdminDto.AdminUserResponse>
    fun getUserById(userId: Long): AdminDto.AdminUserResponse
    fun searchUsers(criteria: AdminDto.UserSearchCriteria, pageable: Pageable): Page<AdminDto.AdminUserResponse>
    fun updateUser(userId: Long, request: AdminDto.AdminUserUpdateRequest): AdminDto.AdminUserResponse
    fun updateUserStatus(userId: Long, request: AdminDto.UserStatusUpdateRequest)
    fun updateUserRole(userId: Long, request: AdminDto.UserRoleUpdateRequest)
    fun deleteUser(userId: Long)
    fun restoreUser(userId: Long)

    // Statistics
    fun getUserStatistics(): StatisticsDto.UserStatisticsResponse
    fun getUserActivity(userId: Long): StatisticsDto.UserActivityResponse

    // Internal methods
    fun getUserEntity(userId: Long): Users
    fun getUserEntityByEmail(email: String): Users
    fun recordLogin(userId: Long)
    fun incrementFailedLoginAttempts(email: String)
    fun resetFailedLoginAttempts(userId: Long)
    fun isAccountLocked(userId: Long): Boolean
    fun lockAccount(userId: Long)
    fun unlockAccount(userId: Long)
}