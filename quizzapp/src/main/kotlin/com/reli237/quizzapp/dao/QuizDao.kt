package com.reli237.quizzapp.dao

import com.reli237.quizzapp.model.Quiz
import org.springframework.data.jpa.repository.JpaRepository

// Repository interface for Quiz entity with basic CRUD operations
interface QuizDao : JpaRepository<Quiz, Long> {

}