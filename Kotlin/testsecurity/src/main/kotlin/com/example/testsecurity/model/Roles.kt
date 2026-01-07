package com.example.testsecurity.model

import jakarta.persistence.*
import java.time.Instant
import java.util.*

@Entity
@Table(name = "roles")
class Roles(

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: UUID? = null,

    @Column(unique = true, nullable = false)
    var name: String = "",

    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),

    @ManyToMany(mappedBy = "roles")
    var users: MutableSet<User> = mutableSetOf()
)
