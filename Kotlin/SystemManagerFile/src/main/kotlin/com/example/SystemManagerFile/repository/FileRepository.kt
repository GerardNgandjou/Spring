package com.example.SystemManagerFile.repository

import com.example.SystemManagerFile.entity.FileEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface FileRepository: JpaRepository<FileEntity, Long> {

    fun findByFileNameIgnoreCase (fileName: String): List<FileEntity>
    fun findByFileType(fileType: String): List<FileEntity>
    fun findByFileName(fileName: String): Optional<FileEntity>

}