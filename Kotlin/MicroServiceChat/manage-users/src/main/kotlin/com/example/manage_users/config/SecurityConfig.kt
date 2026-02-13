package com.example.manage_users.config

import com.example.manage_users.security.JwtAuthenticationFilter
import com.example.manage_users.security.JwtProvider
import com.example.manage_users.security.OAuth2SuccessHandler
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.AuthenticationProvider
import org.springframework.security.authentication.dao.DaoAuthenticationProvider
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.userdetails.UserDetailsService
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

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
class SecurityConfig(
    private val userDetailsService: UserDetailsService,
    private val jwtAuthenticationFilter: JwtAuthenticationFilter,
    private val jwtProvider: JwtProvider,
    private val oAuth2AuthenticationSuccessHandler: OAuth2SuccessHandler,
    private val clientRegistrationRepository: ClientRegistrationRepository
) {

    @Bean
    fun securityFilterChain(
        http: HttpSecurity,
        authenticationProvider: AuthenticationProvider
    ): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .cors { it.configurationSource(corsConfigurationSource()) }
            .sessionManagement { session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            }
            .authorizeHttpRequests { authorize ->
                authorize
                    // Public endpoints
                    .requestMatchers(
                        "/api/auth/**",
                        "/oauth2/**",
                        "/login/oauth2/**",
                        "/error",
                        "/actuator/health",
                        "/swagger-ui/**",
                        "/v3/api-docs/**",
                        "/swagger-resources/**",
                        "/webjars/**"
                    ).permitAll()

                    // Profile endpoints - authenticated users
                    .requestMatchers("/api/profile/**").authenticated()

                    // Admin endpoints - require ADMIN role
                    .requestMatchers("/api/admin/**").hasRole("ADMIN")

                    // Statistics endpoints - require ADMIN role
                    .requestMatchers("/api/admin/statistics/**").hasRole("ADMIN")

                    // All other requests require authentication
                    .anyRequest().authenticated()
            }
            .oauth2Login { oauth2 ->
                oauth2
                    .authorizationEndpoint { authorizationEndpoint ->
                        authorizationEndpoint
                            .authorizationRequestResolver(authorizationRequestResolver())
                            .baseUri("/oauth2/authorization")
                    }
                    .redirectionEndpoint { redirectionEndpoint ->
                        redirectionEndpoint.baseUri("/login/oauth2/code/*")
                    }
                    .userInfoEndpoint { userInfoEndpoint ->
                        userInfoEndpoint.userService(oAuth2UserService())
                    }
                    .successHandler(oAuth2AuthenticationSuccessHandler)
                    .failureUrl("/login?error=true")
            }
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)

        return http.build()
    }

    @Bean
    fun authenticationProvider(passwordEncoder: PasswordEncoder): AuthenticationProvider {
        val authProvider = DaoAuthenticationProvider()
        authProvider.setUserDetailsService(userDetailsService)
        authProvider.setPasswordEncoder(passwordEncoder)
        return authProvider
    }

    @Bean
    fun passwordEncoder(): PasswordEncoder {
        return BCryptPasswordEncoder()
    }

    @Bean
    fun authenticationManager(config: AuthenticationConfiguration): AuthenticationManager {
        return config.authenticationManager
    }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration()
        configuration.allowedOrigins = listOf(
            "http://localhost:3000",
            "http://localhost:4200",
            "http://localhost:8080"
        )
        configuration.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
        configuration.allowedHeaders = listOf("*")
        configuration.allowCredentials = true
        configuration.exposedHeaders = listOf("Authorization")
        configuration.maxAge = 3600L

        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", configuration)
        return source
    }

    @Bean
    fun authorizationRequestResolver(): DefaultOAuth2AuthorizationRequestResolver {
        val defaultResolver = DefaultOAuth2AuthorizationRequestResolver(
            clientRegistrationRepository,
            OAuth2AuthorizationRequestRedirectFilter.DEFAULT_AUTHORIZATION_REQUEST_BASE_URI
        )

        // Customize the authorization request
        defaultResolver.setAuthorizationRequestCustomizer { customizer ->
            customizer
                .additionalParameters { params ->
                    params["prompt"] = "consent"
                    params["access_type"] = "offline"
                }
        }

        return defaultResolver
    }

    @Bean
    fun oAuth2UserService(): OAuth2UserService<OAuth2UserRequest, OAuth2User> {
        val delegate = DefaultOAuth2UserService()

        return OAuth2UserService { userRequest ->
            val oAuth2User = delegate.loadUser(userRequest)

            // Extract user information from OAuth2 provider
            val attributes = oAuth2User.attributes
            val email = oAuth2User.getAttribute<String>("email")
            val name = oAuth2User.getAttribute<String>("name") ?: ""
            val firstName = oAuth2User.getAttribute<String>("given_name") ?: name.split(" ").firstOrNull() ?: ""
            val lastName = oAuth2User.getAttribute<String>("family_name") ?: name.split(" ").drop(1).joinToString(" ")

            // Create a custom OAuth2User with extracted attributes
            object : OAuth2User {
                override fun getName(): String = email ?: name
                override fun getAttributes(): Map<String, Any> = attributes
                override fun getAuthorities(): Collection<GrantedAuthority> {
                    return oAuth2User.authorities
                }
            }
        }
    }
}