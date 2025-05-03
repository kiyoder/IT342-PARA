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
import com.example.para_mobile.api.RetrofitClient
import com.example.para_mobile.util.GoogleAuthHelper
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class LoginActivity : AppCompatActivity() {

    private lateinit var btnLogin: Button
    private lateinit var tvGoToRegister: TextView
    private lateinit var etEmail: EditText
    private lateinit var etPassword: EditText
    private lateinit var ivTogglePassword: ImageView
    private lateinit var progressBar: ProgressBar
    private lateinit var cvGoogle: CardView
    private lateinit var cvFacebook: CardView
    private var isPasswordVisible = false
    private val TAG = "LoginActivity"

    // Google Sign-In
    private lateinit var googleAuthHelper: GoogleAuthHelper
    private val RC_SIGN_IN = 9001

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        // Check if user is already logged in
        val token = getSharedPreferences("app_prefs", MODE_PRIVATE).getString("jwt_token", null)
        if (!token.isNullOrEmpty()) {
            startActivity(Intent(this, MainActivity::class.java))
            finish() // prevent going back to login
            return
        }

        // Initialize views
        btnLogin = findViewById(R.id.btnLogin)
        tvGoToRegister = findViewById(R.id.tvGoToRegister)
        etEmail = findViewById(R.id.etUsername)
        etPassword = findViewById(R.id.etPassword)
        ivTogglePassword = findViewById(R.id.ivTogglePassword)
        progressBar = findViewById(R.id.progressBar)
        cvGoogle = findViewById(R.id.cvGoogle)
        cvFacebook = findViewById(R.id.cvFacebook)

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

        // Facebook Sign-In (placeholder)
        cvFacebook.setOnClickListener {
            Toast.makeText(this, "Facebook login not implemented yet", Toast.LENGTH_SHORT).show()
        }

        // Redirect to RegisterActivity when the link is clicked
        tvGoToRegister.setOnClickListener {
            val intent = Intent(this, RegisterActivity::class.java)
            startActivity(intent)
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

                    if (!token.isNullOrEmpty()) {
                        saveToken(token)

                        // After login, fetch user profile to get additional info
                        fetchUserProfile("Bearer $token")
                    } else {
                        Toast.makeText(applicationContext, "Login failed: Invalid token", Toast.LENGTH_LONG).show()
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

    private fun fetchUserProfile(token: String) {
        RetrofitClient.instance.getUserProfile(token).enqueue(object : Callback<Map<String, Any>> {
            override fun onResponse(call: Call<Map<String, Any>>, response: Response<Map<String, Any>>) {
                if (response.isSuccessful && response.body() != null) {
                    val profile = response.body()!!

                    // Save user profile data
                    val sharedPref = getSharedPreferences("app_prefs", MODE_PRIVATE)
                    val editor = sharedPref.edit()

                    profile["id"]?.let { editor.putString("user_id", it.toString()) }
                    profile["username"]?.let { editor.putString("username", it.toString()) }
                    profile["email"]?.let { editor.putString("email", it.toString()) }

                    editor.apply()

                    Toast.makeText(applicationContext, "Login Successful!", Toast.LENGTH_LONG).show()

                    // Launch MainActivity and clear back stack
                    val intent = Intent(applicationContext, MainActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                    finish()
                } else {
                    // Even if profile fetch fails, we can still proceed to main activity
                    // since we have the token
                    Log.w(TAG, "Failed to fetch user profile, proceeding anyway")

                    Toast.makeText(applicationContext, "Login Successful!", Toast.LENGTH_LONG).show()

                    val intent = Intent(applicationContext, MainActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                    finish()
                }
            }

            override fun onFailure(call: Call<Map<String, Any>>, t: Throwable) {
                Log.e(TAG, "Failed to fetch user profile", t)

                // Even if profile fetch fails, we can still proceed to main activity
                // since we have the token
                Toast.makeText(applicationContext, "Login Successful!", Toast.LENGTH_LONG).show()

                val intent = Intent(applicationContext, MainActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                finish()
            }
        })
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

    private fun saveToken(token: String) {
        val sharedPref = getSharedPreferences("app_prefs", MODE_PRIVATE)
        sharedPref.edit().putString("jwt_token", "Bearer $token").apply()
        Log.d(TAG, "Token saved successfully")
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
                    handleGoogleSignInSuccess(account)
                },
                onFailure = { errorMessage ->
                    progressBar.visibility = View.GONE
                    Toast.makeText(this, errorMessage, Toast.LENGTH_SHORT).show()
                }
            )
        }
    }

    private fun handleGoogleSignInSuccess(account: GoogleSignInAccount) {
        Log.d(TAG, "Google Sign-In successful: ${account.email}")

        // Get ID token from Google account
        val idToken = account.idToken

        if (idToken != null) {
            // Send the token to your backend
            authenticateWithBackend(idToken, account.email ?: "", account.displayName ?: "")
        } else {
            progressBar.visibility = View.GONE
            Toast.makeText(this, "Failed to get ID token from Google", Toast.LENGTH_SHORT).show()
        }
    }

    private fun authenticateWithBackend(idToken: String, email: String, displayName: String) {
        // Create a request to send to your backend
        val googleAuthRequest = mapOf(
            "idToken" to idToken,
            "email" to email,
            "displayName" to displayName
        )

        RetrofitClient.instance.loginWithGoogle(googleAuthRequest).enqueue(object : Callback<Map<String, String>> {
            override fun onResponse(call: Call<Map<String, String>>, response: Response<Map<String, String>>) {
                progressBar.visibility = View.GONE

                if (response.isSuccessful && response.body() != null) {
                    val responseBody = response.body()!!
                    val token = responseBody["accessToken"]

                    if (!token.isNullOrEmpty()) {
                        saveToken(token)

                        // After login, fetch user profile to get additional info
                        fetchUserProfile("Bearer $token")
                    } else {
                        Toast.makeText(applicationContext, "Google login failed: Invalid token", Toast.LENGTH_LONG).show()
                    }
                } else {
                    try {
                        val errorBody = response.errorBody()?.string()
                        Log.e(TAG, "Google login failed: $errorBody")
                        Toast.makeText(applicationContext, "Google login failed", Toast.LENGTH_LONG).show()
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing error response", e)
                        Toast.makeText(applicationContext, "Google login failed: ${response.message()}", Toast.LENGTH_LONG).show()
                    }
                }
            }

            override fun onFailure(call: Call<Map<String, String>>, t: Throwable) {
                progressBar.visibility = View.GONE
                Log.e(TAG, "Network error during Google login", t)
                Toast.makeText(applicationContext, "Error: ${t.message}", Toast.LENGTH_LONG).show()
            }
        })
    }
}
