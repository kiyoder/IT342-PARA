package com.example.para_mobile

import android.os.Bundle
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar

class LanguageActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_language)

        // Set up toolbar
        val toolbar = findViewById<Toolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setDisplayShowHomeEnabled(true)

        // Set up back button
        toolbar.setNavigationOnClickListener {
            onBackPressed()
        }

        // Set up language selection
        val languageGroup = findViewById<RadioGroup>(R.id.language_group)
        languageGroup.setOnCheckedChangeListener { _, checkedId ->
            val selectedLanguage = findViewById<RadioButton>(checkedId).text.toString()
            Toast.makeText(this, "Language changed to $selectedLanguage", Toast.LENGTH_SHORT).show()
            // Implement language change logic
        }
    }
}