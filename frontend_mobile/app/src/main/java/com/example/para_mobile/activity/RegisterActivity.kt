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

        // Create signup request - note we're using SignupRequest now instead of RegisterRequest
        val request = SignupRequest(username, email, password)

        RetrofitClient.instance.registerUser(request).enqueue(object : Callback<Map<String, Any>> {
            override fun onResponse(call: Call<Map<String, Any>>, response: Response<Map<String, Any>>) {
                progressBar.visibility = View.GONE
                btnRegister.isEnabled = true

                if (response.isSuccessful && response.body() != null) {
                    val responseBody = response.body()!!

                    // Extract token from response
                    val accessToken = responseBody["accessToken"] as? String

                    if (accessToken != null) {
                        // Save token to shared preferences
                        val sharedPref = getSharedPreferences("app_prefs", MODE_PRIVATE)
                        sharedPref.edit().putString("jwt_token", "Bearer $accessToken").apply()

                        // Extract user info if available
                        @Suppress("UNCHECKED_CAST")
                        val user = responseBody["user"] as? Map<String, Any>
                        if (user != null) {
                            val userId = user["id"] as? String
                            val username = user["username"] as? String
                            val email = user["email"] as? String

                            // Save user info
                            sharedPref.edit()
                                .putString("user_id", userId)
                                .putString("username", username)
                                .putString("email", email)
                                .apply()
                        }

                        Toast.makeText(applicationContext, "Registration Successful!", Toast.LENGTH_LONG).show()
                        Log.d(TAG, "Registration successful")

                        // Redirect to MainActivity after successful registration
                        val intent = Intent(this@RegisterActivity, MainActivity::class.java)
                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                        startActivity(intent)
                        finish()
                    } else {
                        Toast.makeText(applicationContext, "Registration successful but token missing", Toast.LENGTH_LONG).show()
                        // Redirect to LoginActivity if token is missing
                        val intent = Intent(this@RegisterActivity, LoginActivity::class.java)
                        startActivity(intent)
                        finish()
                    }
                } else {
                    try {
                        val errorBody = response.errorBody()?.string()
                        Log.e(TAG, "Registration failed: $errorBody")
                        Toast.makeText(applicationContext, "Registration failed: ${errorBody ?: response.message()}", Toast.LENGTH_LONG).show()
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
                    handleGoogleSignUpSuccess(account)
                },
                onFailure = { errorMessage ->
                    progressBar.visibility = View.GONE
                    Toast.makeText(this, errorMessage, Toast.LENGTH_SHORT).show()
                }
            )
        }
    }

    private fun handleGoogleSignUpSuccess(account: GoogleSignInAccount) {
        Log.d(TAG, "Google Sign-Up successful: ${account.email}")

        // Get ID token from Google account
        val idToken = account.idToken

        if (idToken != null) {
            // Send the token to your backend
            registerWithBackend(idToken, account.email ?: "", account.displayName ?: "")
        } else {
            progressBar.visibility = View.GONE
            Toast.makeText(this, "Failed to get ID token from Google", Toast.LENGTH_SHORT).show()
        }
    }

    private fun registerWithBackend(idToken: String, email: String, displayName: String) {
        // Create a request to send to your backend
        val googleAuthRequest = mapOf(
            "idToken" to idToken,
            "email" to email,
            "displayName" to displayName
        )

        RetrofitClient.instance.registerWithGoogle(googleAuthRequest).enqueue(object : Callback<Map<String, Any>> {
            override fun onResponse(call: Call<Map<String, Any>>, response: Response<Map<String, Any>>) {
                progressBar.visibility = View.GONE

                if (response.isSuccessful && response.body() != null) {
                    val responseBody = response.body()!!

                    // Extract token from response
                    val accessToken = responseBody["accessToken"] as? String

                    if (accessToken != null) {
                        // Save token to shared preferences
                        val sharedPref = getSharedPreferences("app_prefs", MODE_PRIVATE)
                        sharedPref.edit().putString("jwt_token", "Bearer $accessToken").apply()

                        // Extract user info if available
                        @Suppress("UNCHECKED_CAST")
                        val user = responseBody["user"] as? Map<String, Any>
                        if (user != null) {
                            val userId = user["id"] as? String
                            val username = user["username"] as? String
                            val email = user["email"] as? String

                            // Save user info
                            sharedPref.edit()
                                .putString("user_id", userId)
                                .putString("username", username)
                                .putString("email", email)
                                .apply()
                        }

                        Toast.makeText(applicationContext, "Google Registration Successful!", Toast.LENGTH_LONG).show()

                        // Redirect to MainActivity after successful registration
                        val intent = Intent(this@RegisterActivity, MainActivity::class.java)
                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                        startActivity(intent)
                        finish()
                    } else {
                        Toast.makeText(applicationContext, "Google registration successful but token missing", Toast.LENGTH_LONG).show()
                        // Redirect to LoginActivity if token is missing
                        val intent = Intent(this@RegisterActivity, LoginActivity::class.java)
                        startActivity(intent)
                        finish()
                    }
                } else {
                    try {
                        val errorBody = response.errorBody()?.string()
                        Log.e(TAG, "Google registration failed: $errorBody")
                        Toast.makeText(applicationContext, "Google registration failed", Toast.LENGTH_LONG).show()
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing error response", e)
                        Toast.makeText(applicationContext, "Google registration failed: ${response.message()}", Toast.LENGTH_LONG).show()
                    }
                }
            }

            override fun onFailure(call: Call<Map<String, Any>>, t: Throwable) {
                progressBar.visibility = View.GONE
                Log.e(TAG, "Network error during Google registration", t)
                Toast.makeText(applicationContext, "Error: ${t.message}", Toast.LENGTH_LONG).show()
            }
        })
    }
}
