package com.reli237.web_application_chat.service

import com.reli237.web_application_chat.dto.FileUploadDto
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.util.LinkedMultiValueMap
import org.springframework.util.MultiValueMap
import org.springframework.web.client.RestTemplate
import org.springframework.web.multipart.MultipartFile
import java.time.LocalDateTime
import java.util.concurrent.ConcurrentHashMap

@Service
class ChatFileStorageService(
    @Value("\${file.service.url:http://localhost:8752}")
    private val fileServiceUrl: String,

    @Value("\${file.upload.chunk-size:1048576}") // 1MB default
    private val chunkSize: Long
) {

    /**
     * Upload file to file service via API Gateway
     */
    private val restTemplate = RestTemplate()
    private val uploadProgress = ConcurrentHashMap<Long, FileUploadProgress>()

    /**
     * Upload file to file service via API Gateway
     */
    fun uploadFile(
        userId: Long,
        file: MultipartFile,
        description: String,
        chatRoomId: Long
    ): FileMetadata {
        val uploadId = System.currentTimeMillis()

        try {
            // Prepare request to file service
            val headers = HttpHeaders()
            headers.contentType = MediaType.MULTIPART_FORM_DATA
            headers.set("X-User-Id", userId.toString())
            headers.set("X-Chat-Room-Id", chatRoomId.toString())

            val body: MultiValueMap<String, Any> = LinkedMultiValueMap()
            body.add("file", file.resource)
            body.add("description", description)

            val requestEntity = HttpEntity(body, headers)

            // Call file service through API Gateway
            val response = restTemplate.postForEntity(
                "$fileServiceUrl/api/files/upload",
                requestEntity,
                Map::class.java
            )

            if (response.statusCode.is2xxSuccessful && response.body != null) {
                val fileData = response.body as Map<String, Any>

                return FileMetadata(
                    id = (fileData["id"] as Number).toLong(),
                    fileName = fileData["fileName"] as String,
                    originalFileName = fileData["originalFileName"] as String,
                    fileType = fileData["fileType"] as String,
                    fileSize = fileData["fileSize"] as String,
                    uploadTime = LocalDateTime.parse(fileData["uploadTime"].toString()),
                    uploadedBy = userId.toString(),
                    downloadUrl = "$fileServiceUrl/download/${fileData["fileName"]}",
                    thumbnailUrl = generateThumbnailUrl(fileData["fileName"] as String)
                )
            } else {
                throw RuntimeException("File upload failed: ${response.statusCode}")
            }
        } catch (e: Exception) {
            throw RuntimeException("Failed to upload file: ${e.message}", e)
        }
    }

    /**
     * Get file metadata by ID
     */
    fun getFileMetadata(fileId: Long): FileMetadata? {
        return try {
            val response = restTemplate.getForEntity(
                "$fileServiceUrl/api/files/$fileId",
                Map::class.java
            )

            if (response.statusCode.is2xxSuccessful && response.body != null) {
                val fileData = response.body as Map<String, Any>

                FileMetadata(
                    id = fileId,
                    fileName = fileData["fileName"] as String,
                    originalFileName = fileData["originalFileName"] as String,
                    fileType = fileData["fileType"] as String,
                    fileSize = fileData["fileSize"] as String,
                    uploadTime = LocalDateTime.parse(fileData["uploadTime"].toString()),
                    uploadedBy = "unknown",
                    downloadUrl = "$fileServiceUrl/download/${fileData["fileName"]}",
                    thumbnailUrl = generateThumbnailUrl(fileData["fileName"] as String)
                )
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    } }

    /**
     * Upload large file in chunks
     */
    fun uploadFileInChunks(
        userId: Long,
        fileName: String,
        fileData: ByteArray,
        totalChunks: Int,
        chunkIndex: Int,
        description: String,
        chatRoomId: Long
    ): FileUploadDto.FileUploadResponse {
        val uploadId = calculateUploadId(userId, fileName)

        // Track chunk upload
        val progress = uploadProgress.getOrPut(uploadId) {
            FileUploadProgress(
                uploadId = uploadId,
                fileName = fileName,
                totalSize = fileData.size.toLong() * totalChunks,
                uploadedSize = 0
            )
        }

        progress.uploadedSize += fileData.size

        // In a real implementation, you would:
        // 1. Save chunk to temporary storage
        // 2. Track which chunks are uploaded
        // 3. When all chunks are uploaded, combine them
        // 4. Send complete file to file service

        return FileUploadDto.FileUploadResponse(
            uploadId = uploadId,
            fileName = fileName,
            fileSize = fileData.size.toLong(),
            downloadUrl = "$fileServiceUrl/download/temp_$uploadId",
            status = if (chunkIndex == totalChunks - 1) {
                FileUploadDto.UploadStatus.COMPLETED
            } else {
                FileUploadDto.UploadStatus.UPLOADING
            }
        )
    }

    /**
     * Get file metadata by ID
     */
    fun getFileMetadata(fileId: Long): FileUploadDto.FileMetadata? {
        return try {
            val response = restTemplate.getForEntity(
                "$fileServiceUrl/api/files/$fileId",
                Map::class.java
            )

            if (response.statusCode.is2xxSuccessful && response.body != null) {
                val fileData = response.body as Map<*, *>

                FileUploadDto.FileMetadata(
                    id = fileId,
                    fileName = fileData["fileName"] as String,
                    originalFileName = fileData["originalFileName"] as String,
                    fileType = fileData["fileType"] as String,
                    fileSize = fileData["fileSize"] as String,
                    uploadTime = LocalDateTime.parse(fileData["uploadTime"] as String),
                    uploadedBy = "unknown",
                    downloadUrl = "$fileServiceUrl/download/${fileData["fileName"]}",
                    thumbnailUrl = generateThumbnailUrl(fileData["fileName"] as String)
                )
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Get upload progress
     */
    fun getUploadProgress(uploadId: Long): FileUploadDto.UploadProgressResponse? {
        val progress = uploadProgress[uploadId] ?: return null

        return FileUploadDto.UploadProgressResponse(
            uploadId = uploadId,
            progress = ((progress.uploadedSize.toDouble() / progress.totalSize) * 100).toInt(),
            bytesUploaded = progress.uploadedSize,
            totalBytes = progress.totalSize,
            estimatedTimeRemaining = calculateRemainingTime(progress)
        )
    }

    /**
     * Cancel upload
     */
    fun cancelUpload(uploadId: Long): Boolean {
        val progress = uploadProgress.remove(uploadId)
        return progress != null
    }

    private fun calculateUploadId(userId: Long, fileName: String): Long {
        return "$userId-$fileName".hashCode().toLong()
    }

    private fun generateThumbnailUrl(fileName: String): String? {
        // Generate thumbnail URL for images
        val imageExtensions = listOf("jpg", "jpeg", "png", "gif", "bmp")
        val extension = fileName.substringAfterLast('.', "").lowercase()

        return if (extension in imageExtensions) {
            "$fileServiceUrl/api/files/thumbnail/$fileName"
        } else {
            null
        }
    }

    private fun calculateRemainingTime(progress: FileUploadProgress): Int {
        // Simple calculation - can be improved
        if (progress.uploadedSize == 0L) return -1

        val bytesPerSecond = progress.uploadedSize / 5 // Assuming 5 seconds elapsed
        if (bytesPerSecond == 0L) return -1

        val remainingBytes = progress.totalSize - progress.uploadedSize
        return (remainingBytes / bytesPerSecond).toInt()
    }

    data class FileUploadProgress(
        val uploadId: Long,
        val fileName: String,
        val totalSize: Long,
        var uploadedSize: Long,
        var status: FileUploadStatus = FileUploadStatus.UPLOADING
    )


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
    )

    enum class FileUploadStatus {
        PENDING,
        UPLOADING,
        PROCESSING,
        COMPLETED,
        FAILED,
        CANCELLED
    }
}
