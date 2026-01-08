package com.reli237.quizzapp.controller

import com.reli237.quizzapp.model.QuestionWrapper
import com.reli237.quizzapp.model.Questions
import com.reli237.quizzapp.model.Response
import com.reli237.quizzapp.service.QuizService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping
class QuizController(
    private val quizService: QuizService
) {

    @PostMapping("create")
    fun createQuiz(
        @RequestParam category: String,
        @RequestParam numQ: Long,
        @RequestParam title: String
    ) : ResponseEntity<String> {
        return quizService.createQuiz(category, numQ, title)
    }

    @GetMapping("get/{id}")
    fun getQuizQuestions(@PathVariable id: Long) : ResponseEntity<List<QuestionWrapper>>{
        return quizService.getQuizQuestion(id)
    }

    @PostMapping("submit/{id}")
    fun submitQuiz(
        @PathVariable id: Long,
        @RequestBody responses: List<Response>
    ): ResponseEntity<Long> {
        return quizService.calculateTheResult(id, responses)
    }

}