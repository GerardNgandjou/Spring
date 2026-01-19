package com.reli237.quizzapp.model

import jakarta.persistence.*

@Entity
data class Quiz(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long,
    val title:String,

    @ManyToMany
    val questions: List<Questions>
) {

}
