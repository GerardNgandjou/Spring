package com.reli237.quizzapp.dao

import com.reli237.quizzapp.model.Quiz
import org.springframework.data.jpa.repository.JpaRepository

interface QuizDao: JpaRepository<Quiz, Long> {

}
