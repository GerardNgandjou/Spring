package com.example.manage_users.security

import com.example.manage_users.repository.UsersRepository
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service

@Service
class CustomUserDetailsService (
    private val usersRepository: UsersRepository
) : UserDetailsService {

    override fun loadUserByUsername(username: String): UserDetails {
        val user = usersRepository.findByEmail(username)
            .orElseThrow { UsernameNotFoundException("User not found with email: $username") }

        return User(
            user.email,
            user.password,
            user.isActive,
            true,
            true,
            true,
            listOf(SimpleGrantedAuthority("ROLE_${user.role.name}"))
        )
    }
}