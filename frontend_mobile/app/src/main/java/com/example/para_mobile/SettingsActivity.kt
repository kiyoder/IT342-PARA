package com.example.para_mobile

import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.SwitchCompat

class SettingsActivity : AppCompatActivity() {

    private lateinit var sharedPrefs: SharedPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        // Initialize SharedPreferences
        sharedPrefs = getSharedPreferences("app_prefs", MODE_PRIVATE)

        // Set up click listeners and toggles
        setupClickListeners()

        // Close button functionality
        val closeButton = findViewById<ImageButton>(R.id.close_button)
        closeButton.setOnClickListener {
            // Return to the previous activity using onBackPressed() or finish()
            onBackPressed()
        }
    }

    private fun setupClickListeners() {
        // Profile section
        val profileSection = findViewById<LinearLayout>(R.id.profile_section)
        profileSection.setOnClickListener {
            startActivity(Intent(this, PersonalDetailsActivity::class.java))
        }

        // Favorites section
        val favoritesSection = findViewById<LinearLayout>(R.id.favorites_section)
        favoritesSection.setOnClickListener {
            startActivity(Intent(this, FavoritesActivity::class.java))
        }

        // Edit profile section
        val editProfileSection = findViewById<LinearLayout>(R.id.edit_profile_section)
        editProfileSection.setOnClickListener {
            startActivity(Intent(this, EditProfileActivity::class.java))
        }

        // Change password section
        val changePasswordSection = findViewById<LinearLayout>(R.id.change_password_section)
        changePasswordSection.setOnClickListener {
            startActivity(Intent(this, ChangePasswordActivity::class.java))
        }

        // Notifications switch
        val notificationsSwitch = findViewById<SwitchCompat>(R.id.notifications_switch)
        notificationsSwitch.isChecked = sharedPrefs.getBoolean("notifications_enabled", true)

        notificationsSwitch.setOnCheckedChangeListener { _, isChecked ->
            sharedPrefs.edit().putBoolean("notifications_enabled", isChecked).apply()
            Toast.makeText(this, "Notifications ${if (isChecked) "enabled" else "disabled"}", Toast.LENGTH_SHORT).show()
        }

        // Language section
        val languageSection = findViewById<LinearLayout>(R.id.language_section)
        languageSection.setOnClickListener {
            startActivity(Intent(this, LanguageActivity::class.java))
        }

        // Logout section
        val logoutSection = findViewById<LinearLayout>(R.id.logout_section)
        logoutSection.setOnClickListener {
            showLogoutConfirmationDialog()
        }
    }

    private fun showLogoutConfirmationDialog() {
        AlertDialog.Builder(this)
            .setTitle("Logout")
            .setMessage("Are you sure you want to logout?")
            .setPositiveButton("Yes") { _, _ ->
                // Handle logout logic: Clear the authentication token from SharedPreferences
                val editor = sharedPrefs.edit()
                editor.remove("jwt_token")  // Remove the JWT token using the correct key
                editor.apply()

                // Optionally, show a Toast message confirming logout
                Toast.makeText(this, "Logging out...", Toast.LENGTH_SHORT).show()

                // Redirect to the login screen
                val intent = Intent(this, LoginActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                finish() // Ensure the user cannot go back to the Settings screen
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    // This method ensures the close button behavior correctly
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        super.onBackPressed()
        // You can also call finish() here if you prefer to close the activity explicitly
    }
}
