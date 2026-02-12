package com.example.manage_users.security

import com.example.manage_users.execption.InvalidTokenException
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class JwtAuthenticationFilter (
    private val jwtProvider: JwtProvider,
    private val customUserDetailsService: CustomUserDetailsService
) : OncePerRequestFilter() {

    private val logger = LoggerFactory.getLogger(JwtAuthenticationFilter::class.java)

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        try {
            // Skip filter for public endpoints
            if (isPublicEndpoint(request)) {
                filterChain.doFilter(request, response)
                return
            }

            val jwt = getJwtFromRequest(request)

            if (jwt != null) {
                try {
                    if (jwtProvider.validateToken(jwt)) {
                        val username = jwtProvider.getUsernameFromToken(jwt)
                        val userDetails = customUserDetailsService.loadUserByUsername(username)

                        val authentication = UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.authorities
                        )
                        authentication.details = WebAuthenticationDetailsSource().buildDetails(request)

                        SecurityContextHolder.getContext().authentication = authentication
                    }
                } catch (ex: InvalidTokenException) {
                    logger.error("Invalid JWT token: ${ex.message}")
                } catch (ex: Exception) {
                    logger.error("Could not set user authentication in security context", ex)
                }
            }
        } catch (ex: Exception) {
            logger.error("Error in JWT authentication filter", ex)
        }

        filterChain.doFilter(request, response)
    }

    private fun isPublicEndpoint(request: HttpServletRequest): Boolean {
        val path = request.servletPath
        return path.startsWith("/api/auth/") ||
                path.startsWith("/error") ||
                path.startsWith("/swagger-ui") ||
                path.startsWith("/v3/api-docs") ||
                path.startsWith("/actuator/health") ||
                path == "/"
    }

    private fun getJwtFromRequest(request: HttpServletRequest): String? {
        val bearerToken = request.getHeader("Authorization")
        return if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            bearerToken.substring(7)
        } else null
    }
}