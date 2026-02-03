package com.example.SystemManagerFile.controller

import com.example.SystemManagerFile.dto.ChatFileResponse
import com.example.SystemManagerFile.service.FileService
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.core.io.Resource
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.servlet.mvc.support.RedirectAttributes

//@RestController
@Controller
@RequestMapping("/api/files")
class WebController(
    private var fileService: FileService
) {

    companion object {
        private val log = LoggerFactory.getLogger(WebController::class.java)
    }

    @PostMapping("/upload")
    fun uploadFileApi(
        @RequestParam("file") file: MultipartFile,
        @RequestParam("description") description: String,
        @RequestHeader(value = "X-User-Id", required = false) userId: Long?,
        @RequestHeader(value = "X-Chat-Room-Id", required = false) chatRoomId: Long?
    ): ResponseEntity<ChatFileResponse.FileUploadResponse> {

        try {
            // Add chat room info to description if available
            val finalDescription = if (chatRoomId != null) {
                "From chat room $chatRoomId - $description"
            } else {
                description
            }

            val fileEntity = fileService.storeFile(file, finalDescription)

            val response = ChatFileResponse.FileUploadResponse(
                id = fileEntity.id,
                fileName = fileEntity.fileName,
                originalFileName = fileEntity.originalFileName,
                fileType = fileEntity.fileType,
                fileSize = fileEntity.fileSize,
                filePath = fileEntity.filePath,
                uploadTime = fileEntity.uploadTime,
                description = fileEntity.description,
                downloadUrl = "/download/${fileEntity.fileName}"
            )

            return ResponseEntity.ok(response)
        } catch (ex: Exception) {
            return ResponseEntity.status(500).build()
        }
    }

    @GetMapping("/{id}")
    fun getFileInfo(@PathVariable id: Long): ResponseEntity<ChatFileResponse.FileUploadResponse> {
        val fileEntity = fileService.getFileById(id)

        return if (fileEntity != null) {
            val response = ChatFileResponse.FileUploadResponse(
                id = fileEntity.id,
                fileName = fileEntity.fileName,
                originalFileName = fileEntity.originalFileName,
                fileType = fileEntity.fileType,
                fileSize = fileEntity.fileSize,
                filePath = fileEntity.filePath,
                uploadTime = fileEntity.uploadTime,
                description = fileEntity.description,
                downloadUrl = "/download/${fileEntity.fileName}"
            )
            ResponseEntity.ok(response)
        } else {
            ResponseEntity.notFound().build()
        }
    }

    @GetMapping
    fun getAllFiles(): ResponseEntity<List<ChatFileResponse.FileUploadResponse>> {
        val files = fileService.getAllFile()

        val responses = files.map { fileEntity ->
            ChatFileResponse.FileUploadResponse(
                id = fileEntity.id,
                fileName = fileEntity.fileName,
                originalFileName = fileEntity.originalFileName,
                fileType = fileEntity.fileType,
                fileSize = fileEntity.fileSize,
                filePath = fileEntity.filePath,
                uploadTime = fileEntity.uploadTime,
                description = fileEntity.description,
                downloadUrl = "/download/${fileEntity.fileName}"
            )
        }

        return ResponseEntity.ok(responses)
    }

    @DeleteMapping("/{id}")
    fun deleteFile(@PathVariable id: Long): ResponseEntity<Void> {
        fileService.deleteFileById(id)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/")
    fun index(model: Model): String {
        model.addAttribute("files", fileService.getAllFile())
        return "index"
    }


    @GetMapping("/upload")
    fun upload(): String {
        return "upload"
    }

    @PostMapping("/uplo7ad")
    fun uploadFile(
        @RequestParam("file") file: MultipartFile,
        @RequestParam("description") description: String,
        redirectAttibute: RedirectAttributes
    ): String {
        try {
            fileService.storeFile(file, description)
            redirectAttibute.addFlashAttribute("successMessage", "File uploaded successfully!")
        } catch (ex: Exception) {
            redirectAttibute.addFlashAttribute("errorMessage", "File uploaded failed!")
            log.error("File uploaded failed! ", ex)
        }

        return "redirect:/upload"
    }

    @GetMapping("/download/{fileName:.+}")
    fun downloadFile(
        @PathVariable
        fileName: String,
        request: HttpServletRequest
    ) : ResponseEntity<Resource> {

        val resource = fileService.loadFileAsRessource(fileName)
        var contentType = request.servletContext.getMimeType(resource.file.absolutePath)

        if (contentType == null) {
            contentType = "application/octet-stream"
        }

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"${resource.filename}\""
            )
            .body(resource)
    }
}