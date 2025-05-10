package com.example.para_mobile.activity

import android.content.Intent
import android.os.Bundle
import android.text.InputType
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import com.example.para_mobile.api.LoginRequest
import com.example.para_mobile.R
import com.example.para_mobile.api.ApiService
import com.example.para_mobile.api.RetrofitClient
import com.example.para_mobile.util.AuthUtil
import com.example.para_mobile.util.GoogleAuthHelper
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat

class LoginActivity : AppCompatActivity() {

    private lateinit var btnLogin: Button
    private lateinit var tvGoToRegister: TextView
    private lateinit var etEmail: EditText
    private lateinit var etPassword: EditText
    private lateinit var ivTogglePassword: ImageView
    private lateinit var progressBar: ProgressBar
    private lateinit var cvGoogle: CardView
    private var isPasswordVisible = false
    private val TAG = "LoginActivity"

    // Google Sign-In
    private lateinit var googleAuthHelper: GoogleAuthHelper
    private val RC_SIGN_IN = 9001

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        // Initialize views
        btnLogin = findViewById(R.id.btnLogin)
        tvGoToRegister = findViewById(R.id.tvGoToRegister)
        etEmail = findViewById(R.id.etUsername)
        etPassword = findViewById(R.id.etPassword)
        ivTogglePassword = findViewById(R.id.ivTogglePassword)
        progressBar = findViewById(R.id.progressBar)
        cvGoogle = findViewById(R.id.cvGoogle)

        // Initialize Google Sign-In
        googleAuthHelper = GoogleAuthHelper(this)

        // Toggle password visibility logic
        ivTogglePassword.setOnClickListener {
            togglePasswordVisibility()
        }

        // Login button logic
        btnLogin.setOnClickListener {
            loginUser()
        }

        // Google Sign-In
        cvGoogle.setOnClickListener {
            signInWithGoogle()
        }

        // Redirect to RegisterActivity when the link is clicked
        tvGoToRegister.setOnClickListener {
            val intent = Intent(this, RegisterActivity::class.java)
            startActivity(intent)
        }

        findViewById<CardView>(R.id.cvBiometrics).setOnClickListener {
            showBiometricPrompt()
        }
    }

    private fun loginUser() {
        val email = etEmail.text.toString().trim()
        val password = etPassword.text.toString().trim()

        if (email.isEmpty() || password.isEmpty()) {
            Toast.makeText(applicationContext, "Please fill all fields", Toast.LENGTH_SHORT).show()
            return
        }

        // Show progress
        progressBar.visibility = View.VISIBLE
        btnLogin.isEnabled = false

        val request = LoginRequest(email, password)
        RetrofitClient.instance.loginUser(request).enqueue(object : Callback<Map<String, String>> {
            override fun onResponse(call: Call<Map<String, String>>, response: Response<Map<String, String>>) {
                progressBar.visibility = View.GONE
                btnLogin.isEnabled = true

                if (response.isSuccessful && response.body() != null) {
                    val responseBody = response.body()!!
                    val token = responseBody["accessToken"]
                    val user = responseBody["user"] as? Map<*, *>
                    val supabaseUid = user?.get("id") as? String
                    val email = user?.get("email") as? String
                    val phone = user?.get("phone") as? String
                    val username = user?.get("username") as? String

                    if (!token.isNullOrEmpty() && token.count { it == '.' } == 2) {
                        AuthUtil.saveAuthToken(this@LoginActivity, token)
                        val editor = getSharedPreferences("app_prefs", MODE_PRIVATE).edit()
                        if (supabaseUid != null) {
                            editor.putString("supabase_uid", supabaseUid)
                            editor.putString("user_id", supabaseUid)
                        }
                        if (email != null) editor.putString("email", email)
                        if (phone != null) editor.putString("phone", phone)
                        if (username != null) editor.putString("username", username)
                        editor.apply()
                        fetchUserProfileWithFallback("Bearer $token", username, email)
                        return
                    } else {
                        Toast.makeText(applicationContext, "Login failed: Invalid token from server", Toast.LENGTH_LONG).show()
                        return
                    }
                } else {
                    try {
                        val errorBody = response.errorBody()?.string()
                        Log.e(TAG, "Login failed: $errorBody")
                        Toast.makeText(applicationContext, "Invalid Credentials", Toast.LENGTH_LONG).show()
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing error response", e)
                        Toast.makeText(applicationContext, "Login failed: ${response.message()}", Toast.LENGTH_LONG).show()
                    }
                }
            }

            override fun onFailure(call: Call<Map<String, String>>, t: Throwable) {
                progressBar.visibility = View.GONE
                btnLogin.isEnabled = true
                Log.e(TAG, "Network error during login", t)
                Toast.makeText(applicationContext, "Error: ${t.message}", Toast.LENGTH_LONG).show()
            }
        })
    }

    private fun fetchUserProfileWithFallback(token: String, username: String?, email: String?) {

        // Ensure token doesn't have double "Bearer" prefix
        val cleanToken = token.removePrefix("Bearer ").trim()

        RetrofitClient.instance.getUserProfile("Bearer $cleanToken").enqueue(object : Callback<Map<String, Any>> {
            override fun onResponse(call: Call<Map<String, Any>>, response: Response<Map<String, Any>>) {
                if (response.isSuccessful && response.body() != null) {
                    val profile = response.body()!!
                    val sharedPref = getSharedPreferences("app_prefs", MODE_PRIVATE)
                    val editor = sharedPref.edit()
                    profile["id"]?.let { editor.putString("user_id", it.toString()) }
                    profile["username"]?.let { editor.putString("username", it.toString()) }
                    profile["email"]?.let { editor.putString("email", it.toString()) }
                    editor.apply()
                    Toast.makeText(applicationContext, "Login Successful!", Toast.LENGTH_LONG).show()
                    goToMain()
                } else if (response.code() == 404) {
                    // Profile not found, try to create it
                    createProfileIfMissing(token, username, email)
                } else {
                    // Fallback: keep username/email from registration
                    val sharedPref = getSharedPreferences("app_prefs", MODE_PRIVATE)
                    val editor = sharedPref.edit()
                    if (!username.isNullOrEmpty()) editor.putString("username", username)
                    if (!email.isNullOrEmpty()) editor.putString("email", email)
                    editor.apply()
                    Toast.makeText(applicationContext, "Login Successful! (profile fallback)", Toast.LENGTH_LONG).show()
                    goToMain()
                }
            }
            override fun onFailure(call: Call<Map<String, Any>>, t: Throwable) {
                // Fallback: keep username/email from registration
                val sharedPref = getSharedPreferences("app_prefs", MODE_PRIVATE)
                val editor = sharedPref.edit()
                if (!username.isNullOrEmpty()) editor.putString("username", username)
                if (!email.isNullOrEmpty()) editor.putString("email", email)
                editor.apply()
                Toast.makeText(applicationContext, "Login Successful! (profile fallback)", Toast.LENGTH_LONG).show()
                goToMain()
            }
        })
    }

    private fun createProfileIfMissing(token: String, username: String?, email: String?) {
        if (username.isNullOrEmpty() || email.isNullOrEmpty()) {
            goToMain()
            return
        }
        val updates = mapOf("username" to username, "email" to email)
        RetrofitClient.instance.updateUserProfile(token, updates).enqueue(object : Callback<Map<String, Any>> {
            override fun onResponse(call: Call<Map<String, Any>>, response: Response<Map<String, Any>>) {
                // Try to fetch profile again
                fetchUserProfileWithFallback(token, username, email)
            }
            override fun onFailure(call: Call<Map<String, Any>>, t: Throwable) {
                goToMain()
            }
        })
    }

    private fun goToMain() {
        val intent = Intent(applicationContext, MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

    private fun togglePasswordVisibility() {
        isPasswordVisible = !isPasswordVisible

        if (isPasswordVisible) {
            etPassword.inputType = InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
            ivTogglePassword.setImageResource(R.drawable.ic_visibility_off) // Change icon
        } else {
            etPassword.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            ivTogglePassword.setImageResource(R.drawable.ic_visibility) // Change back icon
        }

        etPassword.setSelection(etPassword.text.length) // Keep cursor at the end
    }

    // Google Sign-In methods
    private fun signInWithGoogle() {
        progressBar.visibility = View.VISIBLE
        val signInIntent = googleAuthHelper.getSignInIntent()
        startActivityForResult(signInIntent, RC_SIGN_IN)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == RC_SIGN_IN) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(data)
            googleAuthHelper.handleSignInResult(
                task,
                onSuccess = { account ->
                    val code = googleAuthHelper.getServerAuthCode(account)
                    if (code != null) {
                        progressBar.visibility = View.VISIBLE
                        RetrofitClient.instance.googleCallback(code).enqueue(object : Callback<Map<String, Any>> {
                            override fun onResponse(call: Call<Map<String, Any>>, response: Response<Map<String, Any>>) {
                                progressBar.visibility = View.GONE
                                if (response.isSuccessful && response.body() != null) {
                                    val responseBody = response.body()!!
                                    val accessToken = responseBody["accessToken"] as? String
                                    if (!accessToken.isNullOrEmpty()) {
                                        AuthUtil.saveAuthToken(this@LoginActivity, accessToken)
                                        // Save user info if available
                                        @Suppress("UNCHECKED_CAST")
                                        val user = responseBody["user"] as? Map<String, Any>
                                        if (user != null) {
                                            val userId = user["id"] as? String
                                            val username = user["username"] as? String
                                            val email = user["email"] as? String
                                            val supabaseUid = user["id"] as? String
                                            val sharedPref = getSharedPreferences("app_prefs", MODE_PRIVATE)
                                            val editor = sharedPref.edit()
                                            editor.putString("user_id", userId)
                                            editor.putString("username", username)
                                            editor.putString("email", email)
                                            if (supabaseUid != null) {
                                                editor.putString("supabase_uid", supabaseUid)
                                                editor.putString("user_id", supabaseUid)
                                            }
                                            editor.apply()
                                        }
                                        // Fetch user profile before redirecting
                                        fetchUserProfileAndGoToMain()
                                    } else {
                                        Toast.makeText(applicationContext, "Google login successful but token missing", Toast.LENGTH_LONG).show()
                                    }
                                } else {
                                    Toast.makeText(applicationContext, "Google login failed", Toast.LENGTH_LONG).show()
                                }
                            }
                            override fun onFailure(call: Call<Map<String, Any>>, t: Throwable) {
                                progressBar.visibility = View.GONE
                                Toast.makeText(applicationContext, "Error: ${t.message}", Toast.LENGTH_LONG).show()
                            }
                        })
                    } else {
                        Toast.makeText(this, "Failed to get Google OAuth code", Toast.LENGTH_SHORT).show()
                    }
                },
                onFailure = { errorMessage ->
                    progressBar.visibility = View.GONE
                    Toast.makeText(this, errorMessage, Toast.LENGTH_SHORT).show()
                }
            )
        }
    }

    private fun fetchUserProfileAndGoToMain() {
        val token = getSharedPreferences("app_prefs", MODE_PRIVATE).getString("jwt_token", null)
        if (token.isNullOrEmpty()) {
            Toast.makeText(applicationContext, "Token not available, please log in again", Toast.LENGTH_LONG).show()
            val intent = Intent(applicationContext, LoginActivity::class.java)
            startActivity(intent)
            finish()
            return
        }
        RetrofitClient.instance.getUserProfile(token).enqueue(object : Callback<Map<String, Any>> {
            override fun onResponse(call: Call<Map<String, Any>>, response: Response<Map<String, Any>>) {
                if (response.isSuccessful && response.body() != null) {
                    val profile = response.body()!!
                    val sharedPref = getSharedPreferences("app_prefs", MODE_PRIVATE)
                    val editor = sharedPref.edit()
                    profile["id"]?.let { editor.putString("user_id", it.toString()) }
                    profile["username"]?.let { editor.putString("username", it.toString()) }
                    profile["email"]?.let { editor.putString("email", it.toString()) }
                    editor.apply()
                }
                // Always go to MainActivity
                val intent = Intent(applicationContext, MainActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                finish()
            }
            override fun onFailure(call: Call<Map<String, Any>>, t: Throwable) {
                // Still go to MainActivity even if profile fetch fails
                val intent = Intent(applicationContext, MainActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                finish()
            }
        })
    }

    private fun showBiometricPrompt() {
        val biometricManager = BiometricManager.from(this)
        when (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)) {
            BiometricManager.BIOMETRIC_SUCCESS -> {
                val executor = ContextCompat.getMainExecutor(this)
                val promptInfo = BiometricPrompt.PromptInfo.Builder()
                    .setTitle("Biometric Login")
                    .setSubtitle("Log in using your biometrics")
                    .setNegativeButtonText("Cancel")
                    .build()

                val biometricPrompt = BiometricPrompt(this, executor,
                    object : BiometricPrompt.AuthenticationCallback() {
                        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                            super.onAuthenticationSucceeded(result)
                            val token = getSharedPreferences("app_prefs", MODE_PRIVATE).getString("jwt_token", null)
                            if (!token.isNullOrEmpty()) {
                                goToMain()
                            } else {
                                Toast.makeText(applicationContext, "No saved session. Please log in first.", Toast.LENGTH_LONG).show()
                            }
                        }
                        override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                            super.onAuthenticationError(errorCode, errString)
                            Toast.makeText(applicationContext, "Authentication error: $errString", Toast.LENGTH_SHORT).show()
                        }
                        override fun onAuthenticationFailed() {
                            super.onAuthenticationFailed()
                            Toast.makeText(applicationContext, "Authentication failed", Toast.LENGTH_SHORT).show()
                        }
                    })
                biometricPrompt.authenticate(promptInfo)
            }
            BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE,
            BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE,
            BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> {
                Toast.makeText(this, "Biometric features are not available/enrolled on this device.", Toast.LENGTH_LONG).show()
            }
        }
    }
}
