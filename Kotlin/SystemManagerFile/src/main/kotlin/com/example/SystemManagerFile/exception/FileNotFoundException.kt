package com.example.SystemManagerFile.exception

import java.lang.RuntimeException

class FileNotFoundException: RuntimeException {

    constructor(message: String) : super(message)

    constructor(message: String, cause: Throwable) : super(message, cause)
}