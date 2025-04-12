package com.example.para_mobile

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

class BottomSheetFragment : BottomSheetDialogFragment() {

    private var searchListener: OnSearchListener? = null

    override fun onAttach(context: Context) {
        super.onAttach(context)
        if (context is OnSearchListener) {
            searchListener = context
        } else {
            throw RuntimeException("$context must implement OnSearchListener")
        }
    }

    override fun onDetach() {
        super.onDetach()
        searchListener = null
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_bottom_sheet, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val searchEditText: EditText = view.findViewById(R.id.search_edit_text)
        val voiceSearchButton: ImageView = view.findViewById(R.id.voice_search_button)
        val homeLocation: LinearLayout = view.findViewById(R.id.home_location)
        val workLocation: LinearLayout = view.findViewById(R.id.work_location)
        val addLocation: LinearLayout = view.findViewById(R.id.add_location)
        val markLocationButton: Button = view.findViewById(R.id.mark_location_button)
        val reportIssueButton: Button = view.findViewById(R.id.report_issue_button)
        val recentLocationItem: LinearLayout = view.findViewById(R.id.recent_location_item)

        // Trigger search when the user hits enter
        searchEditText.setOnEditorActionListener { _, _, _ ->
            val query = searchEditText.text.toString().trim()
            if (query.isNotEmpty()) {
                searchListener?.onSearchQuery(query)
            }
            true
        }

        voiceSearchButton.setOnClickListener {
            // Handle voice search (implement separately)
            Toast.makeText(context, "Voice search not implemented", Toast.LENGTH_SHORT).show()
        }

        homeLocation.setOnClickListener {
            searchListener?.onSearchQuery("Home")
        }

        workLocation.setOnClickListener {
            searchListener?.onSearchQuery("Work")
        }

        addLocation.setOnClickListener {
            Toast.makeText(context, "Add favorite location", Toast.LENGTH_SHORT).show()
        }

        markLocationButton.setOnClickListener {
            Toast.makeText(context, "Marking your current location...", Toast.LENGTH_SHORT).show()
        }

        reportIssueButton.setOnClickListener {
            Toast.makeText(context, "Opening issue report form...", Toast.LENGTH_SHORT).show()
        }

        recentLocationItem.setOnClickListener {
            searchListener?.onSearchQuery("Naga, Cebu") // Replace with real recent data
        }
    }

    interface OnSearchListener {
        fun onSearchQuery(query: String)
    }
}
