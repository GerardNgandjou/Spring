package com.example.testsecurity.model

import jakarta.persistence.*
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import java.time.Instant

//@NoArgsConstructor
@Entity
@Table(name = "users")
class User(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(unique = true, nullable = false)
    val email: String,

    @Column(nullable = false)
    var passwordHash: String,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = [JoinColumn(name = "user_id")],
        inverseJoinColumns = [JoinColumn(name = "role_id")]
    )
    val roles: MutableSet<String> = mutableSetOf()
) : UserDetails {

    constructor() : this(
        id = 0,
        email = "",
        passwordHash = "",
        createdAt = Instant.now(),
        updatedAt = Instant.now(),
        roles = mutableSetOf()
    )

    // Spring Security UserDetails implementation
    override fun getAuthorities(): MutableCollection<out GrantedAuthority> {
        return roles
            .map { SimpleGrantedAuthority("ROLE_${it}") }
            .toMutableList()
    }


    override fun getUsername(): String = email
    
    override fun getPassword(): String = passwordHash
    
    // Account status methods (customize as needed)
    override fun isAccountNonExpired(): Boolean = true
    override fun isAccountNonLocked(): Boolean = true
    override fun isCredentialsNonExpired(): Boolean = true
    override fun isEnabled(): Boolean = true
}