package com.reli237.quizzapp.service

import com.reli237.quizzapp.dao.QuestionDao
import com.reli237.quizzapp.model.Questions
import org.springframework.stereotype.Service

@Service
class QuestionService(
    private val questionDao: QuestionDao
) {

    fun getAllQuestion(): List<Questions> {
        return questionDao.findAll()
    }

    fun getAllQuestionByCategory(category: String): List<Questions> {
        return questionDao.findByCategory(category)
    }

}
