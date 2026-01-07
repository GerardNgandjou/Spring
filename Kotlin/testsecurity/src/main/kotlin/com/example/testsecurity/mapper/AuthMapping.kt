package com.example.testsecurity.mapper

import com.example.testsecurity.dto.RoleResponse
import com.example.testsecurity.dto.UserProfileResponse
import com.example.testsecurity.dto.UserResponse
import com.example.testsecurity.model.Roles
import com.example.testsecurity.model.User

class AuthMapping {


    fun User.toUserResponse() = UserResponse(
        id = id,
        email = email,
        roles = roles.map { it.toRoleResponse() },
        enabled = isEnabled,
        createdAt = createdAt,
        updatedAt = updatedAt
    )

    fun User.toUserProfileResponse() = UserProfileResponse(
        id = id,
        email = email,
        roles = roles.map { it.name }
    )


    fun Roles.toRoleResponse() = RoleResponse(
        id = id.toString(),
        name = name,
        createdAt = createdAt
    )

}