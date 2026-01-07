package com.example.testsecurity.repository

import com.example.testsecurity.model.Roles
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface RoleRepository : JpaRepository<Roles, UUID> {
    fun findByName(name: String): Roles?
}