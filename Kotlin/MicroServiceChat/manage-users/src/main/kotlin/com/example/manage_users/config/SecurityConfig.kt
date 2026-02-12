package com.example.manage_users.config

import com.example.manage_users.security.JwtProvider
import com.example.manage_users.service.interf.UsersService
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.dao.DaoAuthenticationProvider
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import java.util.*

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
class SecurityConfig(
    private val usersService: UsersService,
    private val jwtTokenProvider: JwtProvider,
    private val clientRegistrationRepository: ClientRegistrationRepository
) {

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .cors { cors -> cors.configurationSource(corsConfigurationSource()) }
            .csrf { csrf -> csrf.disable() }
            .sessionManagement { session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            }
            .authorizeHttpRequests { authz ->
                authz
                    // Public endpoints
                    .requestMatchers(
                        "/api/v1/auth/**",
                        "/swagger-ui/**",
                        "/v3/api-docs/**",
                        "/swagger-resources/**",
                        "/webjars/**",
                        "/actuator/health"
                    ).permitAll()
                    // OAuth2 callback endpoint
                    .requestMatchers("/oauth2/**").permitAll()
                    // User profile endpoints (authenticated users)
                    .requestMatchers("/api/v1/users/profile/**").authenticated()
                    // Admin endpoints (require ADMIN role)
                    .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                    .anyRequest().authenticated()
            }
            .oauth2Login { oauth2 ->
                oauth2
                    .authorizationEndpoint { authorizationEndpoint ->
                        authorizationEndpoint
                            .authorizationRequestResolver(authorizationRequestResolver())
                            .baseUri("/api/v1/oauth2/authorization")
                    }
                    .redirectionEndpoint { redirectionEndpoint ->
                        redirectionEndpoint.baseUri("/api/v1/oauth2/callback/*")
                    }
                    .userInfoEndpoint { userInfoEndpoint ->
                        userInfoEndpoint.userService(oAuth2UserService())
                    }
                    .successHandler(oAuth2SuccessHandler())
            }
            .exceptionHandling { exceptions ->
                exceptions
                    .authenticationEntryPoint { request, response, authException ->
                        response.sendError(401, "Unauthorized")
                    }
                    .accessDeniedHandler { request, response, accessDeniedException ->
                        response.sendError(403, "Access Denied")
                    }
            }

        // Add JWT filter before the OAuth2 filter
        http.addFilterBefore(
            JwtAuthenticationFilter(jwtTokenProvider, usersService),
            UsernamePasswordAuthenticationFilter::class.java
        )

        return http.build()
    }

    @Bean
    fun authenticationManager(authenticationConfiguration: AuthenticationConfiguration): AuthenticationManager {
        return authenticationConfiguration.authenticationManager
    }

    @Bean
    fun authenticationProvider(): DaoAuthenticationProvider {
        val authProvider = DaoAuthenticationProvider()
        authProvider.setUserDetailsService(usersService)
        authProvider.setPasswordEncoder(passwordEncoder())
        return authProvider
    }

    @Bean
    fun passwordEncoder(): PasswordEncoder {
        return BCryptPasswordEncoder()
    }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration()
        configuration.allowedOrigins = listOf("http://localhost:3000", "http://localhost:8080")
        configuration.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
        configuration.allowedHeaders = listOf("*")
        configuration.allowCredentials = true
        configuration.exposedHeaders = listOf("Authorization")

        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", configuration)
        return source
    }

    @Bean
    fun authorizationRequestResolver(): OAuth2AuthorizationRequestResolver {
        val defaultResolver = DefaultOAuth2AuthorizationRequestResolver(
            clientRegistrationRepository,
            OAuth2AuthorizationRequestRedirectFilter.DEFAULT_AUTHORIZATION_REQUEST_BASE_URI
        )

        return OAuth2AuthorizationRequestResolver { request ->
            val authorizationRequest: OAuth2AuthorizationRequest? = defaultResolver.resolve(request)

            // Customize the authorization request if needed
            authorizationRequest?.let {
                OAuth2AuthorizationRequest.from(authorizationRequest)
                    .additionalParameters { params ->
                        // Add custom parameters
                        params["prompt"] = "consent"
                    }
                    .build()
            }
        }
    }

    @Bean
    fun oAuth2UserService(): OAuth2UserService<OAuth2UserRequest, OAuth2User> {
        val delegate = DefaultOAuth2UserService()

        return OAuth2UserService { userRequest ->
            val oAuth2User = delegate.loadUser(userRequest)

            // Extract user information from OAuth2 provider
            val email = oAuth2User.getAttribute<String>("email") ?:
            oAuth2User.getAttribute<String>("sub") + "@" + userRequest.clientRegistration.registrationId + ".com"
            val name = oAuth2User.getAttribute<String>("name") ?: ""
            val firstName = name.split(" ").firstOrNull() ?: ""
            val lastName = name.split(" ").lastOrNull() ?: ""

            // Here you would typically:
            // 1. Check if user exists in your database by email
            // 2. If not, create a new user
            // 3. Generate JWT token for the user
            // 4. Return custom user details

            // For now, return a custom OAuth2User with authorities
            object : OAuth2User {
                override fun getName(): String = email
                override fun getAttributes(): Map<String, Any> = oAuth2User.attributes
                override fun getAuthorities(): Collection<GrantedAuthority> {
                    // Return appropriate authorities based on your user
                    return listOf()
                }
            }
        }
    }

    @Bean
    fun oAuth2SuccessHandler(): OAuth2SuccessHandler {
        return OAuth2SuccessHandler(jwtTokenProvider, usersService)
    }
}