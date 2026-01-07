package com.example.testsecurity.model

import jakarta.persistence.*
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import java.time.Instant

//@NoArgsConstructor
@Entity
@Table(name = "users")  // PostgreSQL table name
class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // Auto-increment ID
    val id: Long = 0,
    
    @Column(unique = true, nullable = false)  // Email must be unique and not null
    val email: String,
    
    @Column(nullable = false)  // Password cannot be null
    var passwordHash: String,
    
    @Column(name = "created_at")
    val createdAt: Instant = Instant.now(),
    
    @Column(name = "updated_at")
    var updatedAt: Instant = Instant.now(),
    
    @ElementCollection(fetch = FetchType.EAGER)  // Load roles eagerly with user
    @CollectionTable(name = "user_roles", joinColumns = [JoinColumn(name = "user_id")])
    @Column(name = "role")
    val roles: MutableSet<String> = mutableSetOf("USER")  // Default role
) : UserDetails {

    constructor() : this(0, "", "", Instant.now(), Instant.now(), mutableSetOf("USER"))

    // Spring Security UserDetails implementation
    override fun getAuthorities(): MutableCollection<out GrantedAuthority> {
        return roles.map { SimpleGrantedAuthority(it) }.toMutableList()
    }
    
    override fun getUsername(): String = email
    
    override fun getPassword(): String = passwordHash
    
    // Account status methods (customize as needed)
    override fun isAccountNonExpired(): Boolean = true
    override fun isAccountNonLocked(): Boolean = true
    override fun isCredentialsNonExpired(): Boolean = true
    override fun isEnabled(): Boolean = true
}