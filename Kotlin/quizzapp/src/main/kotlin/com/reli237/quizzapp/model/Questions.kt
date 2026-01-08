package com.reli237.quizzapp.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id

@Entity
data class Questions (

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    val questionTitle: String,
    val option1: String,
    val option2: String,
    val option3: String,
    val option4: String,
    val rightAnswer: String,

    @Column(name = "difficultylevel")
    val difficultyLevel: String,
    val category: String

) {

}