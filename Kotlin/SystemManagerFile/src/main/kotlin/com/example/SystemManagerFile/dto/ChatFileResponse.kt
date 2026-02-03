package com.example.SystemManagerFile.dto

import java.io.Serializable
import java.time.LocalDateTime


class ChatFileResponse {

    /**
     * Response for file upload from chat service
     */
    data class FileUploadResponse(
        val id: Long,
        val fileName: String,
        val originalFileName: String,
        val fileType: String,
        val fileSize: String,
        val filePath: String,
        val uploadTime: LocalDateTime,
        val description: String,
        val downloadUrl: String
    ) : Serializable

    /**
     * Response for WebSocket file upload
     */
    data class FileUploadWsResponse(
        val uploadId: Long,
        val fileName: String,
        val fileSize: Long,
        val downloadUrl: String,
        val timestamp: LocalDateTime = LocalDateTime.now(),
        val status: FileUploadStatus = FileUploadStatus.COMPLETED
    ) : Serializable

    enum class FileUploadStatus {
        PENDING,
        UPLOADING,
        PROCESSING,
        COMPLETED,
        FAILED,
        CANCELLED
    }
}