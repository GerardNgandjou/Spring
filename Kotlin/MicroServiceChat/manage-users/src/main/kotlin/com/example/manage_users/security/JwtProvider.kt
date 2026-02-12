package com.example.manage_users.security

import com.example.manage_users.execption.ExpiredTokenException
import com.example.manage_users.execption.InvalidTokenException
import io.jsonwebtoken.*
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.security.Key
import java.util.*

@Component
class JwtProvider (
    @Value("\${app.jwt.secret}")
    private val jwtSecret: String,

    @Value("\${app.jwt.access-expiration}")
    private val accessExpiration: Long,

    @Value("\${app.jwt.refresh-expiration}")
    private val refreshExpiration: Long,

    @Value("\${app.jwt.email-verification-expiration:86400000}") // 24 hours
    private val emailVerificationExpiration: Long,

    @Value("\${app.jwt.password-reset-expiration:1800000}") // 30 minutes
    private val passwordResetExpiration: Long,

    @Value("\${app.jwt.email-change-expiration:3600000}") // 1 hour
    private val emailChangeExpiration: Long
) {

    private val key: Key by lazy {
        Keys.hmacShaKeyFor(jwtSecret.toByteArray())
    }

    // Access & Refresh tokens
    fun generateAccessToken(username: String): String {
        return generateToken(username, accessExpiration, "ACCESS")
    }

    fun generateRefreshToken(username: String): String {
        return generateToken(username, refreshExpiration, "REFRESH")
    }

    // Email verification tokens (use userId as subject)
    fun createEmailVerificationToken(userId: Long): String {
        return generateToken(userId.toString(), emailVerificationExpiration, "EMAIL_VERIFICATION")
    }

    // Password reset tokens (use userId as subject)
    fun createPasswordResetToken(userId: Long): String {
        return generateToken(userId.toString(), passwordResetExpiration, "PASSWORD_RESET")
    }

    // Email change tokens
    fun createEmailChangeToken(userId: Long, newEmail: String): String {
        val claims = Jwts.claims().setSubject(userId.toString())
        claims["newEmail"] = newEmail
        claims["type"] = "EMAIL_CHANGE"

        val now = Date()
        val expiryDate = Date(now.time + emailChangeExpiration)

        return Jwts.builder()
            .setClaims(claims)
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(key, SignatureAlgorithm.HS512)
            .compact()
    }

    fun getUsernameFromToken(token: String): String {
        val claims = Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .body
        return claims.subject
    }

    private fun generateToken(subject: String, expiration: Long, tokenType: String): String {
        val now = Date()
        val expiryDate = Date(now.time + expiration)

        return Jwts.builder()
            .setSubject(subject)
            .claim("type", tokenType)
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(key, SignatureAlgorithm.HS512)
            .compact()
    }

    fun getUserIdFromToken(token: String): Long {
        val claims = parseClaims(token)
        return claims.subject.toLong()
    }

    fun getEmailFromToken(token: String): String {
        val claims = parseClaims(token)
        return claims.subject
    }

    fun getNewEmailFromToken(token: String): String {
        val claims = parseClaims(token)
        return claims.get("newEmail", String::class.java)
    }

    fun getTokenType(token: String): String {
        val claims = parseClaims(token)
        return claims.get("type", String::class.java)
    }

    fun validateToken(token: String): Boolean {
        return try {
            parseClaims(token)
            true
        } catch (ex: MalformedJwtException) {
            throw InvalidTokenException("Invalid JWT token")
        } catch (ex: ExpiredJwtException) {
            throw ExpiredTokenException("JWT token expired")
        } catch (ex: UnsupportedJwtException) {
            throw InvalidTokenException("Unsupported JWT token")
        } catch (ex: IllegalArgumentException) {
            throw InvalidTokenException("JWT claims string is empty")
        }
    }

    fun validateEmailVerificationToken(token: String): Boolean {
        return try {
            val claims = parseClaims(token)
            claims.get("type", String::class.java) == "EMAIL_VERIFICATION"
        } catch (ex: Exception) {
            false
        }
    }

    fun validatePasswordResetToken(token: String): Boolean {
        return try {
            val claims = parseClaims(token)
            claims.get("type", String::class.java) == "PASSWORD_RESET"
        } catch (ex: Exception) {
            false
        }
    }

    fun validateEmailChangeToken(token: String): Boolean {
        return try {
            val claims = parseClaims(token)
            claims.get("type", String::class.java) == "EMAIL_CHANGE"
        } catch (ex: Exception) {
            false
        }
    }

    private fun parseClaims(token: String): Claims {
        return Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .body
    }

    fun getAccessTokenExpiration(): Long = accessExpiration
    fun getRefreshTokenExpiration(): Long = refreshExpiration
}