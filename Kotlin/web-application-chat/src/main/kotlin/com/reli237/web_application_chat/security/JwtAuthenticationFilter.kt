package com.reli237.web_application_chat.security

import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.util.StringUtils
import org.springframework.web.filter.OncePerRequestFilter

class JwtAuthenticationFilter (
    private val jwtProvider: JwtProvider,
    private val userDetailsService: UserDetailsService
) : OncePerRequestFilter() {

//    private val objectMapper = ObjectMapper()

    /**
     * Extract and validate JWT token from request
     */
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        try {
            val jwt = getJwtFromRequest(request)

            if (StringUtils.hasText(jwt) && jwtProvider.validateToken(jwt)) {
                val email = jwtProvider.getUsernameFromToken(jwt)

                if (StringUtils.hasText(email)) {
                    val userDetails =
                        userDetailsService.loadUserByUsername(email)

                    val authentication = UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.authorities
                    )

                    authentication.details =
                        WebAuthenticationDetailsSource().buildDetails(request)

                    SecurityContextHolder.getContext().authentication =
                        authentication
                }
            }
        } catch (ex: UsernameNotFoundException) {
            SecurityContextHolder.clearContext()
            logger.warn("JWT user not found: ${ex.message}")
        } catch (ex: Exception) {
            SecurityContextHolder.clearContext()
            logger.error("Could not set user authentication in security context", ex)
        }

        filterChain.doFilter(request, response)
    }


    /**
     * Extract JWT token from Authorization header
     * Expected format: "Bearer {token}"
     */
    private fun getJwtFromRequest(request: HttpServletRequest): String? {
        val bearerToken = request.getHeader("Authorization")
        return if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            bearerToken.substring(7)
        } else {
            null
        }
    }
}