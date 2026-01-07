package com.example.SystemManagerFile.exception


//class FileStorageException : RuntimeException {
//
//    constructor(message: String) : super(message)
//
//    constructor(message: String, cause: Throwable) : super(message, cause)
//}


class FileStorageException(
    message: String,
    cause: Throwable? = null
) : RuntimeException(message, cause)