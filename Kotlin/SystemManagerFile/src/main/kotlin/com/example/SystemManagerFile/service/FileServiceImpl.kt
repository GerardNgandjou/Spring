package com.example.SystemManagerFile.service

import com.example.SystemManagerFile.config.FileStorageProperties
import com.example.SystemManagerFile.entity.FileEntity
import com.example.SystemManagerFile.exception.FileNotFoundException
import com.example.SystemManagerFile.exception.FileStorageException
import com.example.SystemManagerFile.repository.FileRepository
import org.springframework.core.io.Resource
import org.springframework.core.io.UrlResource
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.io.IOException
import java.net.MalformedURLException
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.util.UUID

@Service
class FileServiceImpl(
    private val fileRepository: FileRepository,
    private val fileStorageProperties: FileStorageProperties
) : FileService {

    private val fileStorageLocation: Path =
        Paths.get(fileStorageProperties.uploadDir).toAbsolutePath().normalize()

    init {
        try {
            Files.createDirectories(fileStorageLocation)
        } catch (e: Exception) {
            throw FileStorageException("Could not create upload directory", e)
        }
    }

    override fun storeFile(
        file: MultipartFile,
        description: String
    ): FileEntity {
//        TODO("Not yet implemented")

        if (file.isEmpty) {
            throw FileStorageException("Failed to store empty file ${file.originalFilename}")
        }

        val originalFileName = file.originalFilename ?: "unknown"
        val fileName = UUID.randomUUID().toString() + "_" + originalFileName

        try {
            if (fileName.contains("..")) {
                throw FileStorageException("Cannot store file with relative path outside current directory" + fileName)
            }

            var targetLocation = this.fileStorageLocation.resolve(fileName)
            Files.copy(file.inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING)

            val fileEntity = FileEntity(
                fileName = fileName,
                originalFileName = originalFileName,
                fileType = file.contentType ?: "unknown",
                fileSize = file.size.toString(),
                filePath = targetLocation.toString(),
                description = description
            )

            return fileRepository.save(fileEntity)
        } catch (ex: IOException) {
            throw FileStorageException("Failed to store file " + fileName, ex)
        }
    }

    override fun loadFileAsRessource(fileName: String): Resource {
//        TODO("Not yet implemented")

        try {
            var filePath = this.fileStorageLocation.resolve(fileName).normalize()
            var resource = UrlResource(filePath.toUri())

            if (resource.exists()) {
                return resource
            } else
                throw FileNotFoundException("File not found " + fileName)

        } catch (ex: MalformedURLException) {
            throw FileStorageException("File not found" + fileName, ex)
        }
    }

    override fun getAllFile(): List<FileEntity> {
//        TODO("Not yet implemented")
        return this.fileRepository.findAll()
    }

    override fun getFileById(id: Long): FileEntity {
//        TODO("Not yet implemented")
        return this.fileRepository.findById(id)
            .orElse(null)
    }

    override fun deleteFileById(id: Long) {
//        TODO("Not yet implemented")
        return this.fileRepository.findById(id)
            .ifPresent(fileRepository::delete)
    }

    override fun search(fileName: String): List<FileEntity> {
//        TODO("Not yet implemented")
        return this.fileRepository.findByFileNameIgnoreCase(fileName)
    }
}