package com.example.recipeapi.filter

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.stereotype.Component
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.CorsFilter
import java.util.List

@Component
class CustomCorsFilter(

    @Value("\${app.frontend-url}")
    private val frontendUrl: String
) {

    @Bean
    fun coresFilter() : CorsFilter {
        val config = CorsConfiguration()
        config.allowedOrigins = listOf<String?>(frontendUrl)
        config.allowedMethods = listOf<String?>("GET", "POST", "PUT", "DELETE", "OPTIONS")
        config.allowedHeaders = mutableListOf<String?>("Authorization", "Cache-Control", "Content-Type")
        config.allowCredentials = true

        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", config)
        return CorsFilter(source)
    }

}