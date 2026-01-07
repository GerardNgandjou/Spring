package com.example.testsecurity.model

import jakarta.persistence.*
import java.time.Instant
import java.util.*

@Entity
@Table(name = "roles")
data class Roles(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(unique = true, nullable = false)
    val name: String,

    @Column(nullable = false)
    val createdAt: Instant = Instant.now()
)