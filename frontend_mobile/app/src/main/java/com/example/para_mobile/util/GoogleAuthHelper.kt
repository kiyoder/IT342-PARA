package com.example.para_mobile.util

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.util.Log
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.tasks.Task

class GoogleAuthHelper(private val context: Context) {

    private val TAG = "GoogleAuthHelper"
    private lateinit var googleSignInClient: GoogleSignInClient

    // Initialize Google Sign-In
    init {
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestEmail()
            .requestServerAuthCode("354306507425-9ggbb5ds4h17kjgedlbmn2tnfvbtc5v7.apps.googleusercontent.com") // Replace with your web client ID from Google Cloud Console
            .build()

        googleSignInClient = GoogleSignIn.getClient(context, gso)
    }

    // Get sign in intent
    fun getSignInIntent(): Intent {
        return googleSignInClient.signInIntent
    }

    // Handle sign in result
    fun handleSignInResult(completedTask: Task<GoogleSignInAccount>, onSuccess: (GoogleSignInAccount) -> Unit, onFailure: (String) -> Unit) {
        try {
            val account = completedTask.getResult(ApiException::class.java)
            Log.d(TAG, "Google sign in success: ${account.email}")
            onSuccess(account)
        } catch (e: ApiException) {
            Log.w(TAG, "Google sign in failed", e)
            onFailure("Google sign in failed: ${e.statusCode}")
        }
    }

    // Sign out
    fun signOut(onComplete: () -> Unit) {
        googleSignInClient.signOut().addOnCompleteListener {
            onComplete()
        }
    }

    // Check if user is already signed in
    fun getLastSignedInAccount(): GoogleSignInAccount? {
        return GoogleSignIn.getLastSignedInAccount(context)
    }

    // Add a helper to get the server auth code
    fun getServerAuthCode(account: GoogleSignInAccount): String? {
        return account.serverAuthCode
    }
}
