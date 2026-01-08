package com.reli237.quizzapp.model

data class QuestionWrapper(
    val id: Long = 0,
    val questionTitle: String,
    val option1: String,
    val option2: String,
    val option3: String,
    val option4: String,
)
