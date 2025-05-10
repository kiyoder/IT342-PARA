package com.example.para_mobile.api

import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import retrofit2.Response

data class ErrorResponse(
    @SerializedName("error") val error: String? = null,
    @SerializedName("message") val message: String? = null,
    @SerializedName("status") val status: Int? = null
) {
    companion object {
        fun parseError(errorBody: String?): ErrorResponse {
            return try {
                Gson().fromJson(errorBody, ErrorResponse::class.java)
            } catch (e: Exception) {
                ErrorResponse(message = errorBody ?: "Unknown error")
            }
        }

        fun <T> fromResponse(response: Response<T>): ErrorResponse {
            val errorBody = response.errorBody()?.string()
            return parseError(errorBody)
        }
    }

    fun getErrorMessage(): String {
        return error ?: message ?: "Unknown error"
    }
}
