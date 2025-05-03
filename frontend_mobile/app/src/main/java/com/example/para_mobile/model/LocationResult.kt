package com.example.para_mobile.model

data class LocationResult(
    val place_id: Long,
    val licence: String,
    val osm_type: String,
    val osm_id: Long,
    val lat: Double,
    val lon: Double,
    val display_name: String,
    val type: String = "",
    val importance: Double,
    val address: Address
)

data class Address(
    val road: String?,
    val suburb: String?,
    val city: String?,
    val county: String?,
    val state: String?,
    val postcode: String?,
    val country: String?,
    val country_code: String?
)
