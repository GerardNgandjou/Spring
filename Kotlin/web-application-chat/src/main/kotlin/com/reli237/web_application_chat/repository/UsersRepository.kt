package com.reli237.web_application_chat.repository

import com.reli237.web_application_chat.model.UserRole
import com.reli237.web_application_chat.model.Users
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
import java.util.Optional

@Repository
interface UsersRepository: JpaRepository<Users, Long> {

    fun findByEmail(email: String?): Optional<Users>

    fun existsByEmail(email: String): Boolean

    fun findByIsActiveTrue(): List<Users>

    fun findByRole(role: UserRole): List<Users>

    fun findByCreatedAtBetween(startDate: LocalDateTime, endDate: LocalDateTime): List<Users>

}