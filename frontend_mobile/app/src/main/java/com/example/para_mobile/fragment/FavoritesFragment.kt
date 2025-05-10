package com.example.para_mobile.fragment

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import androidx.fragment.app.Fragment
import com.example.para_mobile.R

class FavoritesFragment : Fragment() {

    private lateinit var homeLocation: LinearLayout
    private lateinit var workLocation: LinearLayout
    private lateinit var addLocation: LinearLayout

    private var onHomeLocationListener: (() -> Unit)? = null
    private var onWorkLocationListener: (() -> Unit)? = null
    private var onAddLocationListener: (() -> Unit)? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_favorites, container, false)

        homeLocation = view.findViewById(R.id.home_location)
        workLocation = view.findViewById(R.id.work_location)
        addLocation = view.findViewById(R.id.add_location)

        setupListeners()

        return view
    }

    private fun setupListeners() {
        homeLocation.setOnClickListener {
            onHomeLocationListener?.invoke()
        }

        workLocation.setOnClickListener {
            onWorkLocationListener?.invoke()
        }

        addLocation.setOnClickListener {
            onAddLocationListener?.invoke()
        }
    }

    fun setOnHomeLocationListener(listener: () -> Unit) {
        onHomeLocationListener = listener
    }

    fun setOnWorkLocationListener(listener: () -> Unit) {
        onWorkLocationListener = listener
    }

    fun setOnAddLocationListener(listener: () -> Unit) {
        onAddLocationListener = listener
    }
}
