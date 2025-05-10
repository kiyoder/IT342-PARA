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
import com.example.para_mobile.R
import com.example.para_mobile.api.RetrofitClient
import com.example.para_mobile.api.SignupRequest
import com.example.para_mobile.util.AuthUtil
import com.example.para_mobile.util.GoogleAuthHelper
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class RegisterActivity : AppCompatActivity() {

    private lateinit var btnRegister: Button
    private lateinit var tvGoToLogin: TextView
    private lateinit var etUsername: EditText
    private lateinit var etEmail: EditText
    private lateinit var etPassword: EditText
    private lateinit var ivTogglePassword: ImageView
    private lateinit var progressBar: ProgressBar
    private lateinit var cvGoogle: CardView
    private lateinit var cvFacebook: CardView
    private val TAG = "RegisterActivity"

    // Google Sign-In
    private lateinit var googleAuthHelper: GoogleAuthHelper
    private val RC_SIGN_IN = 9001

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        // Initialize views using findViewById
        btnRegister = findViewById(R.id.btnRegister)
        tvGoToLogin = findViewById(R.id.tvGoToLogin)
        etUsername = findViewById(R.id.etUsername)
        etEmail = findViewById(R.id.etEmail)
        etPassword = findViewById(R.id.etPassword)
        ivTogglePassword = findViewById(R.id.ivTogglePassword)
        progressBar = findViewById(R.id.progressBar)
        cvGoogle = findViewById(R.id.cvGoogle)
        cvFacebook = findViewById(R.id.cvFacebook)

        // Initialize Google Sign-In
        googleAuthHelper = GoogleAuthHelper(this)

        // Set the click listener for the ImageView to toggle password visibility
        ivTogglePassword.setOnClickListener {
            togglePasswordVisibility()
        }

        // Register button click listener
        btnRegister.setOnClickListener {
            registerUser()
        }

        // Google Sign-Up
        cvGoogle.setOnClickListener {
            signUpWithGoogle()
        }

        // Facebook Sign-Up (placeholder)
        cvFacebook.setOnClickListener {
            Toast.makeText(this, "Facebook signup not implemented yet", Toast.LENGTH_SHORT).show()
        }

        // Redirect to LoginActivity when the link is clicked
        tvGoToLogin.setOnClickListener {
            val intent = Intent(this, LoginActivity::class.java)
            startActivity(intent)
        }
    }

    private fun registerUser() {
        val username = etUsername.text.toString().trim()
        val email = etEmail.text.toString().trim()
        val password = etPassword.text.toString().trim()

        // Check for empty username or email
        if (username.isEmpty() || email.isEmpty()) {
            Toast.makeText(applicationContext, "Username and Email cannot be empty", Toast.LENGTH_SHORT).show()
            return
        }

        // Valid email format
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            Toast.makeText(applicationContext, "Please enter a valid email address.", Toast.LENGTH_SHORT).show()
            return
        }

        // Password validation
        if (password.length < 8 || !password.matches(Regex(".*\\d.*")) || !password.matches(Regex(".*[a-z].*"))
            || !password.matches(Regex(".*[A-Z].*")) || !password.matches(Regex(".*[!.,@#$%^&+=].*"))) {
            Toast.makeText(applicationContext, "Password must be at least 8 characters long, contain at least one digit, one lower case letter, one upper case letter, and one special character.", Toast.LENGTH_LONG).show()
            return
        }

        // Show progress
        progressBar.visibility = View.VISIBLE
        btnRegister.isEnabled = false

        // Create signup request
        val request = SignupRequest(username, email, password)

        RetrofitClient.instance.registerUser(request).enqueue(object : Callback<Map<String, Any>> {
            override fun onResponse(call: Call<Map<String, Any>>, response: Response<Map<String, Any>>) {
                progressBar.visibility = View.GONE
                btnRegister.isEnabled = true

                if (response.isSuccessful && response.body() != null) {
                    val responseBody = response.body()!!
                    val user = responseBody["user"] as? Map<*, *>
                    val userId = user?.get("id") as? String
                    val username = user?.get("username") as? String
                    val email = user?.get("email") as? String
                    val accessToken = responseBody["accessToken"] as? String
                    if (accessToken != null) AuthUtil.saveAuthToken(this@RegisterActivity, accessToken)
                    Toast.makeText(applicationContext, "Registration successful! Please log in.", Toast.LENGTH_LONG).show()
                    goToLogin()
                    if (user != null) {
                        val editor = getSharedPreferences("app_prefs", MODE_PRIVATE).edit()
                        if (userId != null) {
                            editor.putString("user_id", userId)
                            editor.putString("supabase_uid", userId)
                        }
                        editor.putString("username", username)
                        editor.putString("email", email)
                        editor.apply()
                    }
                } else {
                    try {
                        val errorBody = response.errorBody()?.string()
                        val errorResponse = com.example.para_mobile.api.ErrorResponse.parseError(errorBody)
                        Log.e(TAG, "Registration failed: ${errorResponse.getErrorMessage()}")
                        Toast.makeText(applicationContext, errorResponse.getErrorMessage(), Toast.LENGTH_LONG).show()
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing error response", e)
                        Toast.makeText(applicationContext, "Registration failed: ${response.message()}", Toast.LENGTH_LONG).show()
                    }
                }
            }

            override fun onFailure(call: Call<Map<String, Any>>, t: Throwable) {
                progressBar.visibility = View.GONE
                btnRegister.isEnabled = true
                Log.e(TAG, "Network error during registration", t)
                Toast.makeText(applicationContext, "Error: ${t.message}", Toast.LENGTH_LONG).show()
            }
        })
    }

    private fun goToLogin() {
        val intent = Intent(this@RegisterActivity, LoginActivity::class.java)
        startActivity(intent)
        finish()
    }

    // Function to toggle the password visibility
    private var isPasswordVisible = false  // Track the state of the password visibility

    private fun togglePasswordVisibility() {
        if (isPasswordVisible) {
            // Hide Password
            etPassword.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            ivTogglePassword.setImageResource(R.drawable.ic_visibility) // Set to "eye open"
        } else {
            // Show Password
            etPassword.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
            ivTogglePassword.setImageResource(R.drawable.ic_visibility_off) // Set to "eye closed"
        }

        isPasswordVisible = !isPasswordVisible  // Toggle state

        // Keep cursor at the end of the text
        etPassword.setSelection(etPassword.text.length)
    }

    // Google Sign-Up methods
    private fun signUpWithGoogle() {
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
                                        AuthUtil.saveAuthToken(this@RegisterActivity, accessToken)
                                        // Save user info if available
                                        @Suppress("UNCHECKED_CAST")
                                        val user = responseBody["user"] as? Map<String, Any>
                                        if (user != null) {
                                            val userId = user["id"] as? String
                                            val username = user["username"] as? String
                                            val email = user["email"] as? String
                                            val editor = getSharedPreferences("app_prefs", MODE_PRIVATE).edit()
                                            if (userId != null) {
                                                editor.putString("user_id", userId)
                                                editor.putString("supabase_uid", userId)
                                            }
                                            editor.putString("username", username)
                                            editor.putString("email", email)
                                            editor.apply()
                                        }
                                        // Fetch user profile before redirecting
                                        fetchUserProfileAndGoToMain()
                                    } else {
                                        Toast.makeText(applicationContext, "Google registration successful but token missing", Toast.LENGTH_LONG).show()
                                        val intent = Intent(this@RegisterActivity, LoginActivity::class.java)
                                        startActivity(intent)
                                        finish()
                                    }
                                } else {
                                    Toast.makeText(applicationContext, "Google registration failed", Toast.LENGTH_LONG).show()
                                }
                            }
                            override fun onFailure(call: Call<Map<String, Any>>, t: Throwable) {
                                progressBar.visibility = View.GONE
                                Toast.makeText(applicationContext, "Error: ${t.message}", Toast.LENGTH_LONG).show()
                            }
                        })
                    } else {
                        progressBar.visibility = View.GONE
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
}
