package com.example.SystemManagerFile.controller

import com.example.SystemManagerFile.service.FileService
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.core.io.Resource
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.servlet.mvc.support.RedirectAttributes
@RestController
@Controller
class WebController(
    private var fileService: FileService
) {

    companion object {
        private val log = LoggerFactory.getLogger(WebController::class.java)
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

    @PostMapping("/upload")
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