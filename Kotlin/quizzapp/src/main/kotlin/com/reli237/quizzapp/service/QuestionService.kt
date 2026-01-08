package com.reli237.quizzapp.service

import com.reli237.quizzapp.dao.QuestionDao
import com.reli237.quizzapp.model.Questions
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import java.util.ArrayList

@Service
class QuestionService(
    private val questionDao: QuestionDao
) {

    fun getAllQuestion(): ResponseEntity<List<Questions>> {
        try {
            return ResponseEntity(questionDao.findAll(), HttpStatus.OK)
        } catch (ex: Exception) {
            ex.stackTrace
        }
        return ResponseEntity(ArrayList(), HttpStatus.BAD_REQUEST)
    }

    fun getAllQuestionByCategory(category: String): ResponseEntity<List<Questions>> {
        try {
            return ResponseEntity(questionDao.findByCategory(category), HttpStatus.ACCEPTED)
        } catch (ex: Exception){
            ex.stackTrace
        }
        return ResponseEntity(ArrayList(), HttpStatus.BAD_REQUEST)
    }

    fun addQuestion(questions: Questions): ResponseEntity<String> {
        questionDao.save(questions)
        return ResponseEntity("Success", HttpStatus.CREATED)
    }

    fun deleteQuestion(id: Long) {
        questionDao.deleteById(id)
    }

}
