package com.example.para_mobile.model

data class SearchSuggestion(
    val id: String,
    val title: String,
    val subtitle: String = "",
    val distance: String? = null,
    val isRecentlyViewed: Boolean = false,
    val iconResId: Int? = null
)
