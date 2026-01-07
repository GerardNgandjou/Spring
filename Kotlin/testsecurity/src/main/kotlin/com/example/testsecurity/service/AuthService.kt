package com.example.testsecurity.service

import com.example.testsecurity.dto.*
import com.example.testsecurity.execption.InvalidTokenException
import com.example.testsecurity.execption.UserAlreadyExistsException
import com.example.testsecurity.model.RefreshToken
import com.example.testsecurity.model.Roles
import com.example.testsecurity.model.User
import com.example.testsecurity.repository.RefreshTokenRepository
import com.example.testsecurity.repository.RoleRepository
import com.example.testsecurity.repository.UserRepository
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import io.github.cdimascio.dotenv.Dotenv

@Service
@Transactional
class AuthService(
    private val authenticationManager: AuthenticationManager,
    private val userRepository: UserRepository,
    private val jwtService: JwtService,
    private val passwordEncoder: PasswordEncoder,
    private val refreshTokenRepository: RefreshTokenRepository? = null,
    private val roleRepository: RoleRepository? = null

) {

    companion object {
        private const val DEFAULT_USER_ROLE = "ROLE_USER"
    }

    private val googleClientId: String = System.getenv("GOOGLE_CLIENT_ID") ?: ""
    private val googleClientSecret: String = System.getenv("GOOGLE_CLIENT_SECRET") ?: ""


    fun printSecrets() {
        println("Google Client ID: $googleClientId")
        println("Google Client Secret: $googleClientSecret")
    }

    // Authenticate user and generate JWT tokens
    fun authenticateUser(loginRequest: LoginRequest): AuthResponse {
        val authentication = authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken(
                loginRequest.email,
                loginRequest.password
            )
        )

        val username = authentication.name ?: loginRequest.email

        // Generate access token
        val accessToken = jwtService.generateAccessToken(username)

        // Generate refresh token
        val refreshToken = jwtService.generateRefreshToken(username)

        // Store refresh token (optional - for token invalidation)
        refreshTokenRepository?.save(
            RefreshToken(
                token = refreshToken,
                username = username,
                expiryDate = Instant.now().plusSeconds(jwtService.refreshTokenExpiration)
            )
        )

        return AuthResponse(
            accessToken = accessToken,
            refreshToken = refreshToken,
            expiresIn = jwtService.accessTokenExpiration
        )
    }

    // Register a new user
    @Transactional
    fun registerUser(registrationRequest: RegistrationRequest): User {
        // Validate password match
        if (registrationRequest.password != registrationRequest.confirmPassword) {
            throw BadCredentialsException("Passwords do not match")
        }

        // Check if user already exists
        if (userRepository.existsByEmail(registrationRequest.email)) {
            throw UserAlreadyExistsException("User with email ${registrationRequest.email} already exists")
        }

        // Encode password
        val encodedPassword = passwordEncoder.encode(registrationRequest.password)
            ?: throw SecurityException("Failed to encode password")

        // Get default role
        val defaultRole = roleRepository?.findByName(DEFAULT_USER_ROLE)
            ?: Roles(name = DEFAULT_USER_ROLE)

        // Create new user
        val user = User(
            email = registrationRequest.email,
            passwordHash = encodedPassword,
            roles = mutableSetOf("defaultRole"),
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )

        // Save user to database
        return userRepository.save(user).also {
            // Send email verification (optional)
            // emailService.sendVerificationEmail(it.email, it.id)
        }
    }

    // Refresh access token using refresh token
    @Transactional
    fun refreshAccessToken(refreshToken: String): AuthResponse {
        // Validate refresh token
        if (!jwtService.validateToken(refreshToken)) {
            throw InvalidTokenException("Invalid refresh token")
        }

        // Check if refresh token exists in database (for invalidation)
        refreshTokenRepository?.findByToken(refreshToken)
            ?.takeIf { it.expiryDate.isAfter(Instant.now()) }
            ?: throw InvalidTokenException("Refresh token expired or not found")

        // Extract username from refresh token
        val username = jwtService.extractUsername(refreshToken)
            ?: throw InvalidTokenException("Invalid refresh token payload")

        // Generate new access token
        val newAccessToken = jwtService.generateAccessToken(username)

        // Optionally rotate refresh token
        val newRefreshToken = jwtService.generateRefreshToken(username)

        // Update refresh token in database
        refreshTokenRepository?.updateToken(refreshToken, newRefreshToken, username)

        return AuthResponse(
            accessToken = newAccessToken,
            refreshToken = newRefreshToken,
            expiresIn = jwtService.accessTokenExpiration
        )
    }

    // Invalidate token (logout)
    @Transactional
    fun invalidateToken(refreshToken: String) {
        refreshTokenRepository?.deleteByToken(refreshToken)
    }

    // Get user profile
    fun getUserProfile(email: String): UserProfileResponse {
        val user = userRepository.findByEmail(email)
            .orElseThrow { UsernameNotFoundException("User not found with email: $email") }

        return UserProfileResponse(
            id = user.id.toString(),
            email = user.email,
            roles = user.roles.map { it }
        )
    }

    // Get all users
    fun getAllUsers(): List<UserResponse> {
        return userRepository.findAll().map { user ->
            UserResponse(
                id = user.id.toString(),
                email = user.email,
                roles = user.roles.map { it },
                enabled = user.isEnabled,
                createdAt = user.createdAt
            )
        }
    }

    // Verify email (optional)
    @Transactional
    fun verifyEmail(userId: String, token: String): Boolean {
        // Implementation for email verification
        return true
    }

    // Request password reset (optional)
    fun requestPasswordReset(email: String) {
        val user = userRepository.findByEmail(email)
            .orElseThrow { UsernameNotFoundException("User not found with email: $email") }

        val resetToken = jwtService.generatePasswordResetToken(user.email)

        // Store reset token with expiry
        // Send email with reset link
    }

    // Reset password (optional)
    @Transactional
    fun resetPassword(token: String, newPassword: String): Boolean {
        // Validate reset token
        if (!jwtService.validateToken(token)) {
            throw InvalidTokenException("Invalid or expired reset token")
        }

        val email = jwtService.extractUsername(token)
            ?: throw InvalidTokenException("Invalid reset token")

        val user = userRepository.findByEmail(email)
            .orElseThrow { UsernameNotFoundException("User not found") }

        // Update password
        user.passwordHash = passwordEncoder.encode(newPassword).toString()
        user.updatedAt = Instant.now()
        userRepository.save(user)

        // Invalidate all user sessions/tokens (optional)
        refreshTokenRepository?.deleteAllByUsername(email)

        return true
    }
}