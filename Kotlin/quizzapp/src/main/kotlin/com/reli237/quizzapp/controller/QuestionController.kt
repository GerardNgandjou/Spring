package com.reli237.quizzapp.controller

import com.reli237.quizzapp.model.Questions
import com.reli237.quizzapp.service.QuestionService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("question")
class QuestionController(
    private val questionService: QuestionService
) {

    @GetMapping("/allQuestions")
    fun getAllQuestions(): ResponseEntity<List<Questions>> {
        return questionService.getAllQuestion()
    }

    @GetMapping("category/{category}")
    fun getQuestionByCategory(@PathVariable category: String) : ResponseEntity<List<Questions>> {
        return questionService.getAllQuestionByCategory(category)
    }

    @PostMapping("add")
    fun addQuestions(@RequestBody questions: Questions): ResponseEntity<String>{
        return questionService.addQuestion(questions)
    }

    @DeleteMapping("delete")
    @ResponseStatus(HttpStatus.ACCEPTED)
    fun deleteQuestion(id: Long) {
        questionService.deleteQuestion(id)
    }

}