package com.reli237.quizzapp.controller

import com.reli237.quizzapp.model.Questions
import com.reli237.quizzapp.service.QuestionService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("question")
class QuestionController(
    private val questionService: QuestionService
) {

    @PostMapping("/allQuestions")
    fun getAllQuestions(): List<Questions> {
        return questionService.getAllQuestion()
    }

    @GetMapping("category/{category}")
    fun getQuestionByCategory(@PathVariable category: String) : List<Questions> {
        return questionService.getAllQuestionByCategory(category)
    }

}