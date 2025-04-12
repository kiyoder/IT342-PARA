package com.example.para_mobile

import android.content.Intent
import android.os.Bundle
import android.text.InputType
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class RegisterActivity : AppCompatActivity() {

    private lateinit var btnRegister: Button
    private lateinit var tvGoToLogin: TextView
    private lateinit var etUsername: EditText
    private lateinit var etEmail: EditText
    private lateinit var etPassword: EditText
    private lateinit var ivTogglePassword: ImageView  // Add this for the ImageView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        // Initialize views using findViewById
        btnRegister = findViewById(R.id.btnRegister)
        tvGoToLogin = findViewById(R.id.tvGoToLogin)
        etUsername = findViewById(R.id.etUsername)
        etEmail = findViewById(R.id.etEmail)
        etPassword = findViewById(R.id.etPassword)
        ivTogglePassword = findViewById(R.id.ivTogglePassword)  // Initialize the ImageView

        // Set the click listener for the ImageView to toggle password visibility
        ivTogglePassword.setOnClickListener {
            togglePasswordVisibility()
        }

        // Register button click listener
        btnRegister.setOnClickListener {
            val username = etUsername.text.toString().trim()
            val email = etEmail.text.toString().trim()
            val password = etPassword.text.toString().trim()

            // Check for empty username or email
            if (username.isEmpty() || email.isEmpty()) {
                Toast.makeText(applicationContext, "Username and Email cannot be empty", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            // ✅ Valid email format
            if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                Toast.makeText(applicationContext, "Please enter a valid email address.", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            // Password validation
            if (password.length < 8 || !password.matches(Regex(".*\\d.*")) || !password.matches(Regex(".*[a-z].*"))
                || !password.matches(Regex(".*[A-Z].*")) || !password.matches(Regex(".*[!.,@#$%^&+=].*"))) {
                Toast.makeText(applicationContext, "Password must be at least 8 characters long, contain at least one digit, one lower case letter, one upper case letter, and one special character.", Toast.LENGTH_LONG).show()
                return@setOnClickListener
            }

            val role = "USER"
            val request = RegisterRequest(username, email, password, role)

            RetrofitClient.instance.registerUser(request).enqueue(object : Callback<UserProfile> {
                override fun onResponse(call: Call<UserProfile>, response: Response<UserProfile>) {
                    if (response.isSuccessful) {
                        Toast.makeText(applicationContext, "Registration Successful!", Toast.LENGTH_LONG).show()

                        // Redirect to LoginActivity after successful registration
                        val intent = Intent(this@RegisterActivity, LoginActivity::class.java)
                        startActivity(intent)
                        finish()  // Close the RegisterActivity
                    } else {
                        Toast.makeText(applicationContext, "Failed: ${response.message()}", Toast.LENGTH_LONG).show()
                    }
                }

                override fun onFailure(call: Call<UserProfile>, t: Throwable) {
                    Toast.makeText(applicationContext, "Error: ${t.message}", Toast.LENGTH_LONG).show()
                }
            })
        }

        // Redirect to LoginActivity when the link is clicked
        tvGoToLogin.setOnClickListener {
            val intent = Intent(this, LoginActivity::class.java)
            startActivity(intent)
        }
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
}
