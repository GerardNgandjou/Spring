package com.reli237.web_application_chat.controller

import com.reli237.web_application_chat.dto.FileUploadResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.util.LinkedMultiValueMap
import org.springframework.util.MultiValueMap
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.client.RestTemplate
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/chat/files")
class ChatFileController(
    @Value("\${file.service.url:http://localhost:8080}")
    private val fileServiceUrl: String
) {

    private val restTemplate = RestTemplate()

    /**
     * Upload file from chat and store it in file service
     */
    @PostMapping("/upload")
    fun uploadFileFromChat(
        @RequestParam("file") file: MultipartFile,
        @RequestParam("description") description: String,
        @RequestHeader("X-User-Id") userId: Long
    ): ResponseEntity<FileUploadResponse> {

        // Prepare headers
        val headers = HttpHeaders()
        headers.contentType = MediaType.MULTIPART_FORM_DATA

        // Prepare body
        val body: MultiValueMap<String, Any> = LinkedMultiValueMap()
        body.add("file", file.resource)
        body.add("description", "$description (Uploaded by user: $userId)")

        // Create request entity
        val requestEntity = HttpEntity(body, headers)

        // Call file service through API Gateway
        val response = restTemplate.postForEntity(
            "$fileServiceUrl/upload",
            requestEntity,
            FileUploadResponse::class.java
        )

        return response
    }

    /**
     * Get file info by ID
     */
    @GetMapping("/{fileId}")
    fun getFileInfo(@PathVariable fileId: Long): ResponseEntity<Any> {
        // In a real implementation, you would call the file service
        // For now, we'll simulate a response
        return ResponseEntity.ok(mapOf(
            "id" to fileId,
            "fileName" to "example.pdf",
            "url" to "$fileServiceUrl/download/example.pdf"
        ))
    }

    /**
     * List all files (paginated)
     */
    @GetMapping
    fun listFiles(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int
    ): ResponseEntity<List<Any>> {
        // Call file service to get list
        return ResponseEntity.ok(emptyList())
    }
}