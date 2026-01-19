package com.reli237.quizzapp.service

import com.reli237.quizzapp.dao.QuestionDao
import com.reli237.quizzapp.model.Questions
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import java.util.ArrayList

@Service // Marks this class as a Spring service component
class QuestionService(
    private val questionDao: QuestionDao // Injects QuestionDao dependency
) {

    // Retrieves all questions from the database
    fun getAllQuestion(): ResponseEntity<List<Questions>> {
        try {
            return ResponseEntity(questionDao.findAll(), HttpStatus.OK) // Returns 200 OK with questions
        } catch (ex: Exception) {
            ex.stackTrace // Logs exception stack trace
        }
        return ResponseEntity(ArrayList(), HttpStatus.BAD_REQUEST) // Returns 400 on error
    }

    // Retrieves questions filtered by category
    fun getAllQuestionByCategory(category: String): ResponseEntity<List<Questions>> {
        try {
            return ResponseEntity(questionDao.findByCategory(category), HttpStatus.ACCEPTED) // Returns 202 Accepted
        } catch (ex: Exception) {
            ex.stackTrace // Logs exception stack trace
        }
        return ResponseEntity(ArrayList(), HttpStatus.BAD_REQUEST) // Returns 400 on error
    }

    // Adds a new question to the database
    fun addQuestion(questions: Questions): ResponseEntity<String> {
        questionDao.save(questions) // Saves the question entity
        return ResponseEntity("Success", HttpStatus.CREATED) // Returns 201 Created
    }

    // Deletes a question by ID
    fun deleteQuestion(id: Long) {
        questionDao.deleteById(id) // Deletes the question entity
    }

}