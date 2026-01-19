package com.reli237.quizzapp.controller

import com.reli237.quizzapp.model.QuestionWrapper
import com.reli237.quizzapp.model.Response
import com.reli237.quizzapp.service.QuizService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController // Marks this class as a REST controller
@RequestMapping // Base URL path for all endpoints
class QuizController(
    private val quizService: QuizService // Injects QuizService dependency
) {

    // POST endpoint to create a new quiz
    @PostMapping("create")
    fun createQuiz(
        @RequestParam category: String, // Query parameter: question category
        @RequestParam numQ: Long, // Query parameter: number of questions
        @RequestParam title: String // Query parameter: quiz title
    ): ResponseEntity<String> {
        return quizService.createQuiz(category, numQ, title) // Delegates to service layer
    }

    // GET endpoint to retrieve questions for a specific quiz
    @GetMapping("get/{id}")
    fun getQuizQuestions(@PathVariable id: Long): ResponseEntity<List<QuestionWrapper>> {
        return quizService.getQuizQuestion(id) // Delegates to service layer
    }

    // POST endpoint to submit quiz answers and calculate score
    @PostMapping("submit/{id}")
    fun submitQuiz(
        @PathVariable id: Long, // Path variable: quiz ID
        @RequestBody responses: List<Response> // Request body: user responses
    ): ResponseEntity<Long> {
        return quizService.calculateTheResult(id, responses) // Delegates to service layer
    }

}