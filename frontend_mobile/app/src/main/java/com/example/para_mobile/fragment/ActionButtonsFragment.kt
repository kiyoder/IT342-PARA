package com.example.para_mobile.fragment

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import androidx.fragment.app.Fragment
import com.example.para_mobile.R

class ActionButtonsFragment : Fragment() {

    private lateinit var markLocationButton: Button
    private lateinit var reportIssueButton: Button

    private var onMarkLocationListener: (() -> Unit)? = null
    private var onReportIssueListener: (() -> Unit)? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_action_buttons, container, false)

        markLocationButton = view.findViewById(R.id.mark_location_button)
        reportIssueButton = view.findViewById(R.id.report_issue_button)

        setupListeners()

        return view
    }

    private fun setupListeners() {
        markLocationButton.setOnClickListener {
            onMarkLocationListener?.invoke()
        }

        reportIssueButton.setOnClickListener {
            onReportIssueListener?.invoke()
        }
    }

    fun setOnMarkLocationListener(listener: () -> Unit) {
        onMarkLocationListener = listener
    }

    fun setOnReportIssueListener(listener: () -> Unit) {
        onReportIssueListener = listener
    }
}
