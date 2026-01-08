package com.reli237.quizzapp.service

import com.reli237.quizzapp.dao.QuestionDao
import com.reli237.quizzapp.dao.QuizDao
import com.reli237.quizzapp.model.QuestionWrapper
import com.reli237.quizzapp.model.Questions
import com.reli237.quizzapp.model.Quiz
import com.reli237.quizzapp.model.Response
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import java.util.*

@Service // Marks this class as a Spring service component
class QuizService(
    private val quizDao: QuizDao, // Injects QuizDao dependency
    private val questionDao: QuestionDao // Injects QuestionDao dependency
) {
    // Creates a new quiz with random questions from a specific category
    fun createQuiz(category: String, numQ: Long, title: String): ResponseEntity<String> {
        // Fetches random questions by category
        val questions: List<Questions> = questionDao.findRandomQuestionByCategory(category, numQ)

        // Creates new Quiz entity
        val quiz = Quiz(
            id = 0, // ID will be auto-generated
            title = title,
            questions = questions
        )
        quizDao.save(quiz) // Saves quiz to database

        return ResponseEntity("Success", HttpStatus.CREATED) // Returns 201 Created
    }

    // Retrieves questions for a quiz (wrapped without answers)
    fun getQuizQuestion(id: Long): ResponseEntity<List<QuestionWrapper>> {

        val quiz: Optional<Quiz> = quizDao.findById(id) // Finds quiz by ID
        val questionFromDB: List<Questions> = quiz.get().questions // Extracts questions
        val questionForUser: MutableList<QuestionWrapper> = ArrayList()

        // Converts Questions to QuestionWrapper (hides correct answers)
        for (q: Questions in questionFromDB) {
            val qw: QuestionWrapper = QuestionWrapper(
                q.id,
                q.questionTitle,
                q.option1,
                q.option2,
                q.option3,
                q.option4
            )

            questionForUser.add(qw)
        }

        return ResponseEntity(questionForUser, HttpStatus.OK) // Returns 200 OK with wrapped questions
    }

    // Calculates quiz score by comparing responses with correct answers
    fun calculateTheResult(id: Long, responses: List<Response>): ResponseEntity<Long> {
        val quiz: Quiz = quizDao.findById(id).get() // Retrieves quiz
        val questions: List<Questions> = quiz.questions // Gets quiz questions
        var right: Long = 0 // Counter for correct answers
        var i = 0 // Index for iterating through questions

        // Compares each response with the correct answer
        for (res: Response in responses) {
            if (res.response.equals(questions.get(i).rightAnswer)) {
                right++ // Increments counter if answer is correct
            }
            i++
        }

        return ResponseEntity(right, HttpStatus.OK) // Returns 200 OK with score
    }

}