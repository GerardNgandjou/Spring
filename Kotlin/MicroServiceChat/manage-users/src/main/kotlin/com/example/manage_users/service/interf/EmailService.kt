package com.example.manage_users.service.interf

import com.example.manage_users.models.Users

interface EmailService {

    fun sendEmailVerification(user: Users)
    fun sendPasswordResetEmail(user: Users)
    fun sendAccountLockedNotification(user: Users)
    fun sendWelcomeEmail(user: Users)
    fun sendEmailChangedNotification(user: Users, oldEmail: String)

}