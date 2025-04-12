package com.example.para_mobile

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView

class FavoritesActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_favorites)

        // Set up toolbar
        val toolbar = findViewById<Toolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setDisplayShowHomeEnabled(true)

        // Set up back button
        toolbar.setNavigationOnClickListener {
            onBackPressed()
        }

        // Set up RecyclerView for favorites list
        // This is a placeholder - you'll need to implement an adapter
        val recyclerView = findViewById<RecyclerView>(R.id.favorites_recycler_view)
        recyclerView.layoutManager = LinearLayoutManager(this)
        // recyclerView.adapter = FavoritesAdapter(getFavoriteLocations())
    }

    // Placeholder method to get favorite locations
    private fun getFavoriteLocations(): List<String> {
        // Replace with actual data from your database/storage
        return listOf("Home", "Work", "Gym", "Mall", "School")
    }
}