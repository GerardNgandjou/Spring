package com.reli237.quizzapp.dao

import com.reli237.quizzapp.model.Questions
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository // Marks this interface as a Spring Data repository
interface QuestionDao : JpaRepository<Questions, Long> { // Extends JpaRepository for CRUD operations

    // Derived query method to find questions by category
    fun findByCategory(category: String): List<Questions>

    // Native SQL query to find random questions by category with limit
    @Query(
        "SELECT *" +
                " FROM questions q " +
                "Where q.category = :category " +
                "ORDER BY RANDOM() LIMIT :numQ",
        nativeQuery = true // Uses native SQL instead of JPQL
    )
    fun findRandomQuestionByCategory(category: String, numQ: Long): List<Questions>
}