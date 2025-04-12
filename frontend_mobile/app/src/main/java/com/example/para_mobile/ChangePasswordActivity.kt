package com.example.para_mobile

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar

class ChangePasswordActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_change_password)

        // Set up toolbar
        val toolbar = findViewById<Toolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setDisplayShowHomeEnabled(true)

        // Set up back button
        toolbar.setNavigationOnClickListener {
            onBackPressed()
        }

        // Set up change password button
        val changePasswordButton = findViewById<Button>(R.id.change_password_button)
        changePasswordButton.setOnClickListener {
            // Validate and change password
            Toast.makeText(this, "Password changed successfully", Toast.LENGTH_SHORT).show()
            finish()
        }
    }
}