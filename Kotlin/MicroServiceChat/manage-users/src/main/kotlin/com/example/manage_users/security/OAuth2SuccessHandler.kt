package com.example.manage_users.security

import com.example.manage_users.models.Language
import com.example.manage_users.models.UserRole
import com.example.manage_users.models.UserStatus
import com.example.manage_users.models.Users
import com.example.manage_users.repository.UsersRepository
import com.example.manage_users.service.interf.UsersService
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.Authentication
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler
import org.springframework.stereotype.Component
import org.springframework.web.util.UriComponentsBuilder
import java.util.UUID

@Component
class OAuth2SuccessHandler (
    private val jwtProvider: JwtProvider,
    private val usersRepository: UsersRepository,
    private val passwordEncoder: PasswordEncoder,
    @Value("\${app.base-url:http://localhost:8082}")
    private val baseUrl: String
) : SimpleUrlAuthenticationSuccessHandler() {

    override fun onAuthenticationSuccess(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication
    ) {
        val oAuth2User = authentication.principal as OAuth2User
        val targetUrl = determineTargetUrl(oAuth2User)

        if (response.isCommitted) {
            logger.debug("Response has already been committed. Unable to redirect to $targetUrl")
            return
        }

        clearAuthenticationAttributes(request)
        redirectStrategy.sendRedirect(request, response, targetUrl)
    }

    private fun determineTargetUrl(oAuth2User: OAuth2User): String {
        val email = extractEmail(oAuth2User)
        val user = getOrCreateUser(oAuth2User, email)

        val accessToken = jwtProvider.generateAccessToken(user.email)
        val refreshToken = jwtProvider.generateRefreshToken(user.email)

        return UriComponentsBuilder.fromUriString("$baseUrl/oauth2/redirect")
            .queryParam("access_token", accessToken)
            .queryParam("refresh_token", refreshToken)
            .queryParam("expires_in", jwtProvider.getAccessTokenExpiration() / 1000)
            .queryParam("token_type", "Bearer")
            .build()
            .toUriString()
    }

    private fun extractEmail(oAuth2User: OAuth2User): String {
        return oAuth2User.getAttribute<String>("email") ?:
        oAuth2User.getAttribute<String>("sub") + "@oauth2user.com"
    }

    private fun getOrCreateUser(oAuth2User: OAuth2User, email: String): Users {
        return usersRepository.findByEmail(email).orElseGet {
            val name = oAuth2User.getAttribute<String>("name") ?: ""
            val firstName = oAuth2User.getAttribute<String>("given_name") ?: name.split(" ").firstOrNull() ?: ""
            val lastName = oAuth2User.getAttribute<String>("family_name") ?: name.split(" ").drop(1).joinToString(" ")

            val user = Users(
                id = 0,
                email = email,
                password = passwordEncoder.encode(UUID.randomUUID().toString()),
                firstName = firstName,
                lastName = lastName,
                phoneNumber = null,
                address = null,
                role = UserRole.USER,
                status = UserStatus.ACTIVE,
                isActive = true,
                emailVerified = true,
                language = Language.EN,
                createdAt = java.time.LocalDateTime.now()
            )

            usersRepository.save(user)
        }
    }
}
