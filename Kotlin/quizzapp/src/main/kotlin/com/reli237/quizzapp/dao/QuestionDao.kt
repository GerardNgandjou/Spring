package com.reli237.quizzapp.dao

import com.reli237.quizzapp.model.Questions
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface QuestionDao : JpaRepository<Questions, Long> {

    fun findByCategory(category: String): List<Questions>
}