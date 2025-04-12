package com.example.para_mobile

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar

class EditProfileActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_edit_profile)

        // Set up toolbar
        val toolbar = findViewById<Toolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setDisplayShowHomeEnabled(true)

        // Set up back button
        toolbar.setNavigationOnClickListener {
            onBackPressed()
        }

        // Set up save button
        val saveButton = findViewById<Button>(R.id.save_button)
        saveButton.setOnClickListener {
            // Save profile changes
            Toast.makeText(this, "Profile updated", Toast.LENGTH_SHORT).show()
            finish()
        }
    }
}