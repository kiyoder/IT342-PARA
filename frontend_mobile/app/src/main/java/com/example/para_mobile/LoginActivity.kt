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

class LoginActivity : AppCompatActivity() {

    private lateinit var btnLogin: Button
    private lateinit var tvGoToRegister: TextView
    private lateinit var etUsername: EditText
    private lateinit var etPassword: EditText
    private lateinit var ivTogglePassword: ImageView
    private var isPasswordVisible = false  // Track password visibility state

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
        etUsername = findViewById(R.id.etUsername)
        etPassword = findViewById(R.id.etPassword)
        ivTogglePassword = findViewById(R.id.ivTogglePassword)

        // Toggle password visibility logic
        ivTogglePassword.setOnClickListener {
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

        // Login button logic
        btnLogin.setOnClickListener {
            val username = etUsername.text.toString().trim()
            val password = etPassword.text.toString().trim()

            if (username.isEmpty() || password.isEmpty()) {
                Toast.makeText(applicationContext, "Please fill all fields", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val request = LoginRequest(username, password)
            RetrofitClient.instance.loginUser(request).enqueue(object : Callback<LoginResponse> {
                override fun onResponse(call: Call<LoginResponse>, response: Response<LoginResponse>) {
                    if (response.isSuccessful) {
                        val token = response.body()?.token
                        if (!token.isNullOrEmpty()) {
                            saveToken(token)
                            Toast.makeText(applicationContext, "Login Successful!", Toast.LENGTH_LONG).show()
        
                            // Launch MainActivity and clear back stack
                            val intent = Intent(applicationContext, MainActivity::class.java)
                            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                            startActivity(intent)
                            finish()
                        } else {
                            Toast.makeText(applicationContext, "Login failed: Invalid token", Toast.LENGTH_LONG).show()
                        }
                    } else {
                        Toast.makeText(applicationContext, "Invalid Credentials", Toast.LENGTH_LONG).show()
                    }
                }

                override fun onFailure(call: Call<LoginResponse>, t: Throwable) {
                    Toast.makeText(applicationContext, "Error: ${t.message}", Toast.LENGTH_LONG).show()
                }
            })
        }

        // Redirect to RegisterActivity when the link is clicked
        tvGoToRegister.setOnClickListener {
            val intent = Intent(this, RegisterActivity::class.java)
            startActivity(intent)
        }
    }

    private fun saveToken(token: String) {
        val sharedPref = getSharedPreferences("app_prefs", MODE_PRIVATE)
        sharedPref.edit().putString("jwt_token", token).apply()
    }
}
