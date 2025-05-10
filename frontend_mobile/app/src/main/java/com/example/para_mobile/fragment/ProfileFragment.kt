package com.example.para_mobile.fragment


import android.app.AlertDialog
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.text.InputType
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.example.para_mobile.R
import com.example.para_mobile.activity.MainActivity
import com.example.para_mobile.api.RetrofitClient
import com.example.para_mobile.util.AuthUtil
import com.google.android.material.button.MaterialButton
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class ProfileFragment : Fragment() {

    private lateinit var etUsername: EditText
    private lateinit var btnEditUsername: ImageButton
    private lateinit var btnChangePassword: ImageButton
    private lateinit var btnSaveProfile: MaterialButton
    private lateinit var btnBack: ImageButton
    private lateinit var progressBar: ProgressBar
    private lateinit var ivProfileImage: ImageView
    private lateinit var btnPickProfileImage: ImageButton
    private lateinit var etEmail: EditText
    private lateinit var btnEditEmail: ImageButton

    private val TAG = "ProfileFragment"
    private val PICK_IMAGE_REQUEST = 101
    private var selectedImageUri: Uri? = null

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_profile, container, false)

        // Initialize views
        etUsername = view.findViewById(R.id.etProfileUsername)
        btnEditUsername = view.findViewById(R.id.btnEditUsername)
        btnChangePassword = view.findViewById(R.id.btnChangePassword)
        btnSaveProfile = view.findViewById(R.id.btnSaveProfile)
        btnBack = view.findViewById(R.id.btnBack)
        progressBar = view.findViewById(R.id.progressBarProfile)
        ivProfileImage = view.findViewById(R.id.ivProfileImage)
        btnPickProfileImage = view.findViewById(R.id.btnPickProfileImage)
        etEmail = view.findViewById(R.id.etProfileEmail)
        btnEditEmail = view.findViewById(R.id.btnEditEmail)

        // Load user data
        loadUserProfile()

        // Set up click listeners
        btnEditUsername.setOnClickListener {
            etUsername.isEnabled = true
            etUsername.requestFocus()
        }

        btnChangePassword.setOnClickListener {
            showChangePasswordDialog()
        }

        btnSaveProfile.setOnClickListener {
            saveUserProfile()
        }

        btnBack.setOnClickListener {
            requireActivity().onBackPressed()
        }

        btnPickProfileImage.setOnClickListener {
            pickProfileImage()
        }

        btnEditEmail.setOnClickListener {
            etEmail.isEnabled = true
            etEmail.requestFocus()
        }

        return view
    }

    private fun loadUserProfile() {
        val sharedPref = requireActivity().getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        val token = sharedPref.getString("jwt_token", null)
        val userId = sharedPref.getString("user_id", null) ?: sharedPref.getString("supabase_uid", null)
        val jwt = token?.removePrefix("Bearer ") ?: ""

        if (jwt.isEmpty() || jwt.split(".").size != 3 || userId.isNullOrEmpty()) {
            Log.e(TAG, "No valid Supabase JWT or user ID found in SharedPreferences. Token: $token, userId: $userId")
            Toast.makeText(context, "Session expired or invalid. Please log in again.", Toast.LENGTH_LONG).show()
            requireActivity().startActivity(Intent(requireContext(), com.example.para_mobile.activity.LoginActivity::class.java))
            requireActivity().finish()
            return
        }

        RetrofitClient.setAuthToken(token!!)
        Log.d(TAG, "Token used for profile: $token, userId: $userId")

        progressBar.visibility = View.VISIBLE
        btnSaveProfile.isEnabled = false

        RetrofitClient.instance.getUserProfile(token).enqueue(object : Callback<Map<String, Any>> {
            override fun onResponse(call: Call<Map<String, Any>>, response: Response<Map<String, Any>>) {
                progressBar.visibility = View.GONE
                btnSaveProfile.isEnabled = true

                if (response.isSuccessful && response.body() != null) {
                    val profile = response.body()!!
                    etUsername.setText(profile["username"]?.toString() ?: "")
                    etEmail.setText(profile["email"]?.toString() ?: "")
                    etUsername.isEnabled = false
                    etEmail.isEnabled = false
                    // TODO: Load profile image if available
                    val editor = sharedPref.edit()
                    profile["id"]?.toString()?.let {
                        editor.putString("user_id", it)
                        editor.putString("supabase_uid", it)
                    }
                    profile["username"]?.toString()?.let { editor.putString("username", it) }
                    profile["email"]?.toString()?.let { editor.putString("email", it) }
                    editor.apply()
                    updateNavHeader()
                } else {
                    val errorBody = response.errorBody()?.string()
                    Log.e(TAG, "Failed to load profile: code=${response.code()}, error=$errorBody")
                    Toast.makeText(context, "Failed to load profile. Please log in again.", Toast.LENGTH_LONG).show()
                    requireActivity().startActivity(Intent(requireContext(), com.example.para_mobile.activity.LoginActivity::class.java))
                    requireActivity().finish()
                }
            }

            override fun onFailure(call: Call<Map<String, Any>>, t: Throwable) {
                progressBar.visibility = View.GONE
                btnSaveProfile.isEnabled = true
                Log.e(TAG, "Network error loading profile", t)
                Toast.makeText(context, "Network error: ${t.message}", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun saveUserProfile() {
        val sharedPref = requireActivity().getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        val token = sharedPref.getString("jwt_token", null)

        if (token == null) {
            Toast.makeText(context, "You are not logged in", Toast.LENGTH_SHORT).show()
            return
        }

        val username = etUsername.text.toString().trim()
        val email = etEmail.text.toString().trim()

        if (username.isEmpty() || email.isEmpty()) {
            Toast.makeText(context, "Username and Email cannot be empty", Toast.LENGTH_SHORT).show()
            return
        }

        progressBar.visibility = View.VISIBLE
        btnSaveProfile.isEnabled = false

        val updates = mutableMapOf<String, String>()
        updates["username"] = username
        updates["email"] = email
        // TODO: If profile image is changed, add image upload logic here

        RetrofitClient.instance.updateUserProfile(token!!, updates).enqueue(object : Callback<Map<String, Any>> {
            override fun onResponse(call: Call<Map<String, Any>>, response: Response<Map<String, Any>>) {
                progressBar.visibility = View.GONE
                btnSaveProfile.isEnabled = true

                if (response.isSuccessful) {
                    Toast.makeText(context, "Profile updated successfully", Toast.LENGTH_SHORT).show()
                    val editor = sharedPref.edit()
                    editor.putString("username", username)
                    editor.putString("email", email)
                    editor.apply()
                    updateNavHeader()
                    etUsername.isEnabled = false
                    etEmail.isEnabled = false
                } else {
                    try {
                        val errorBody = response.errorBody()?.string()
                        Log.e(TAG, "Failed to update profile: $errorBody")
                        Toast.makeText(context, "Failed to update profile", Toast.LENGTH_SHORT).show()
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing error response", e)
                    }
                }
            }

            override fun onFailure(call: Call<Map<String, Any>>, t: Throwable) {
                progressBar.visibility = View.GONE
                btnSaveProfile.isEnabled = true
                Log.e(TAG, "Network error updating profile", t)
                Toast.makeText(context, "Network error: ${t.message}", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun showChangePasswordDialog() {
        val builder = AlertDialog.Builder(requireContext())
        builder.setTitle("Change Password")

        val layout = LinearLayout(requireContext())
        layout.orientation = LinearLayout.VERTICAL
        layout.setPadding(50, 30, 50, 30)

        val currentPassword = EditText(requireContext())
        currentPassword.hint = "Current Password"
        currentPassword.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
        layout.addView(currentPassword)

        val newPassword = EditText(requireContext())
        newPassword.hint = "New Password"
        newPassword.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
        layout.addView(newPassword)

        val confirmPassword = EditText(requireContext())
        confirmPassword.hint = "Confirm New Password"
        confirmPassword.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
        layout.addView(confirmPassword)

        builder.setView(layout)

        builder.setPositiveButton("Change") { dialog, which ->
            val current = currentPassword.text.toString()
            val new = newPassword.text.toString()
            val confirm = confirmPassword.text.toString()

            if (current.isEmpty() || new.isEmpty() || confirm.isEmpty()) {
                Toast.makeText(context, "All fields are required", Toast.LENGTH_SHORT).show()
                return@setPositiveButton
            }

            if (new != confirm) {
                Toast.makeText(context, "New passwords don't match", Toast.LENGTH_SHORT).show()
                return@setPositiveButton
            }

            changePassword(current, new)
        }

        builder.setNegativeButton("Cancel") { dialog, which ->
            dialog.cancel()
        }

        builder.show()
    }

    private fun changePassword(currentPassword: String, newPassword: String) {
        val sharedPref = requireActivity().getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        val token = sharedPref.getString("jwt_token", null)

        if (token == null) {
            Toast.makeText(context, "You are not logged in", Toast.LENGTH_SHORT).show()
            return
        }

        progressBar.visibility = View.VISIBLE
        btnSaveProfile.isEnabled = false

        val passwordData = mapOf(
            "currentPassword" to currentPassword,
            "newPassword" to newPassword
        )

        RetrofitClient.instance.changePassword(token, passwordData).enqueue(object : Callback<Map<String, Any>> {
            override fun onResponse(call: Call<Map<String, Any>>, response: Response<Map<String, Any>>) {
                progressBar.visibility = View.GONE
                btnSaveProfile.isEnabled = true

                if (response.isSuccessful) {
                    Toast.makeText(context, "Password changed successfully", Toast.LENGTH_SHORT).show()
                } else {
                    try {
                        val errorBody = response.errorBody()?.string()
                        Log.e(TAG, "Failed to change password: $errorBody")
                        Toast.makeText(context, "Failed to change password: Incorrect current password", Toast.LENGTH_SHORT).show()
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing error response", e)
                    }
                }
            }

            override fun onFailure(call: Call<Map<String, Any>>, t: Throwable) {
                progressBar.visibility = View.GONE
                btnSaveProfile.isEnabled = true
                Log.e(TAG, "Network error changing password", t)
                Toast.makeText(context, "Network error: ${t.message}", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun updateNavHeader() {
        val sharedPref = requireActivity().getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        val username = sharedPref.getString("username", "Username")
        val email = sharedPref.getString("email", "emailaddress")

        // This assumes you have a method in your MainActivity to update the nav header
        // You'll need to implement this method in your MainActivity
        (requireActivity() as? MainActivity)?.updateNavHeader(username, email)
    }

    private fun pickProfileImage() {
        val intent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
        intent.type = "image/*"
        startActivityForResult(intent, PICK_IMAGE_REQUEST)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == PICK_IMAGE_REQUEST && resultCode == Activity.RESULT_OK && data != null) {
            selectedImageUri = data.data
            ivProfileImage.setImageURI(selectedImageUri)
            // TODO: Upload image to backend if needed
        }
    }
}
