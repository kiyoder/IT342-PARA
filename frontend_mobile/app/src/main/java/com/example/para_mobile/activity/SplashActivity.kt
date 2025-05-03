package com.example.para_mobile.activity

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import com.example.para_mobile.R

class SplashActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash_screen)

        // Check if user is logged in
        val token = getSharedPreferences("app_prefs", MODE_PRIVATE).getString("jwt_token", null)

        // Delay for splash screen (2 seconds)
        Handler(Looper.getMainLooper()).postDelayed({
            // Determine which activity to start based on login status
            val intent = if (token.isNullOrEmpty()) {
                Intent(this, LoginActivity::class.java)
            } else {
                Intent(this, MainActivity::class.java)
            }
            startActivity(intent)
            finish()
        }, 2000)
    }
}