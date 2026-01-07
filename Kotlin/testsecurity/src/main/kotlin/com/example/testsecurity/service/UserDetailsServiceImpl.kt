package com.example.testsecurity.service

import org.springframework.stereotype.Service
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.transaction.annotation.Transactional
import com.example.testsecurity.repository.UserRepository


@Service
class UserDetailsServiceImpl(
    private val userRepository: UserRepository  // Inject UserRepository
) : UserDetailsService {
    
    @Transactional(readOnly = true)
    override fun loadUserByUsername(email: String): UserDetails {
        // Load user by email (username in our case)
        val user = userRepository.findByEmail(email)
            .orElseThrow {
                UsernameNotFoundException("User not found with email: $email")
            }
        
        return user  // User implements UserDetails interface
    }
}