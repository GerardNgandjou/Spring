package com.example.SystemManagerFile.service

import com.example.SystemManagerFile.entity.FileEntity
import org.springframework.web.multipart.MultipartFile
import org.springframework.core.io.Resource

interface FileService {
    fun storeFile(file: MultipartFile, description: String): FileEntity
    fun loadFileAsRessource(fileName: String): Resource
    fun getAllFile(): List<FileEntity>
    fun getFileById(id: Long): FileEntity
    fun deleteFileById(id: Long)
    fun search(fileName: String): List<FileEntity>
}