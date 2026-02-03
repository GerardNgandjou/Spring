package com.reli237.web_application_chat.dto

import java.time.LocalDateTime
import java.io.Serializable


class FileUploadDto {

    /**
     * Request to upload a file via WebSocket
     * Note: For large files, use REST API instead
     */
    data class FileUploadRequest(
        val fileName: String,
        val fileType: String,
        val fileData: String?, // Base64 encoded file data
        val chunkIndex: Int = 0,
        val totalChunks: Int = 1,
        val roomId: Long,
        val description: String = ""
    ) : Serializable

    /**
     * Response for file upload
     */
    data class FileUploadResponse(
        val uploadId: Long,
        val fileName: String,
        val fileSize: Long,
        val downloadUrl: String,
        val timestamp: LocalDateTime = LocalDateTime.now(),
        val status: UploadStatus = UploadStatus.COMPLETED
    ) : Serializable

    /**
     * Notification sent when a file is uploaded
     */
    data class FileUploadNotification(
        val uploadId: Long,
        val fileName: String,
        val fileSize: Long,
        val fileType: String,
        val uploadedBy: Long,
        val roomId: Long,
        val timestamp: LocalDateTime,
        val status: String,
        val downloadUrl: String
    ) : Serializable

    /**
     * Request to download a file
     */
    data class FileDownloadRequest(
        val fileId: Long,
        val fileName: String? = null
    ) : Serializable

    /**
     * Response with file download information
     */
    data class FileDownloadResponse(
        val fileId: Long,
        val fileName: String,
        val fileSize: Long,
        val downloadUrl: String,
        val expiresAt: LocalDateTime,
        val requiresAuth: Boolean = true
    ) : Serializable

    /**
     * Request to check upload progress
     */
    data class UploadProgressRequest(
        val uploadId: Long
    ) : Serializable

    /**
     * Response with upload progress
     */
    data class UploadProgressResponse(
        val uploadId: Long,
        val progress: Int, // Percentage
        val bytesUploaded: Long,
        val totalBytes: Long,
        val estimatedTimeRemaining: Int // seconds
    ) : Serializable

    /**
     * Request to cancel upload
     */
    data class CancelUploadRequest(
        val uploadId: Long
    ) : Serializable

    /**
     * File metadata for display in chat
     */
    data class FileMetadata(
        val id: Long,
        val fileName: String,
        val originalFileName: String,
        val fileType: String,
        val fileSize: String,
        val uploadTime: LocalDateTime,
        val uploadedBy: String,
        val downloadUrl: String,
        val thumbnailUrl: String? = null
    ) : Serializable

    enum class UploadStatus {
        PENDING,
        UPLOADING,
        PROCESSING,
        COMPLETED,
        FAILED,
        CANCELLED
    }
}