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

@Service
class QuizService(
    private val quizDao: QuizDao,
    private val questionDao: QuestionDao
) {
    fun createQuiz(category: String, numQ: Long, title: String): ResponseEntity<String> {
        val questions: List<Questions> = questionDao.findRandomQuestionByCategory(category, numQ)

        val quiz = Quiz (
            id = 0,
            title = title,
            questions = questions
        )
        quizDao.save(quiz)

        return ResponseEntity("Success", HttpStatus.CREATED)
    }

    fun getQuizQuestion(id: Long): ResponseEntity<List<QuestionWrapper>> {

        val quiz: Optional<Quiz> = quizDao.findById(id)
        val questionFromDB: List<Questions> = quiz.get().questions
        val questionForUser: MutableList<QuestionWrapper> = ArrayList()

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

        return ResponseEntity(questionForUser, HttpStatus.OK)

    }

    fun calculateTheResult(id: Long, responses: List<Response>): ResponseEntity<Long> {
        val quiz: Quiz = quizDao.findById(id).get()
        val questions: List<Questions> = quiz.questions
        var right: Long = 0
        var i = 0

        for (res: Response in responses) {
            if (res.response.equals(questions.get(i).rightAnswer)) {
                right++
            }
            i++
        }

        return ResponseEntity(right, HttpStatus.OK)
    }


}