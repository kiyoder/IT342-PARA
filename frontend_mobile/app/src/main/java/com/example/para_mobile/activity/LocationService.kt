package com.example.para_mobile.activity

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.annotation.RequiresPermission
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import org.osmdroid.util.GeoPoint

class LocationService(private val context: Context) {

    private val fusedLocationClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)

    // Cebu City Sports Complex
    private val defaultLocation = GeoPoint(10.3004222, 123.8952833)

    fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }

    @RequiresPermission(allOf = [Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION])
    fun getCurrentLocation(callback: (GeoPoint) -> Unit) {
        if (hasLocationPermission()) {
            fusedLocationClient.getCurrentLocation(
                Priority.PRIORITY_HIGH_ACCURACY,
                null
            ).addOnSuccessListener { location ->
                if (location != null) {
                    callback(GeoPoint(location.latitude, location.longitude))
                } else {
                    callback(defaultLocation)
                }
            }.addOnFailureListener {
                callback(defaultLocation)
            }
        } else {
            callback(defaultLocation)
        }
    }

    @RequiresPermission(allOf = [Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION])
    fun getLastLocation(callback: (GeoPoint) -> Unit) {
        if (hasLocationPermission()) {
            fusedLocationClient.lastLocation.addOnSuccessListener { location ->
                if (location != null) {
                    callback(GeoPoint(location.latitude, location.longitude))
                } else {
                    callback(defaultLocation)
                }
            }.addOnFailureListener {
                callback(defaultLocation)
            }
        } else {
            callback(defaultLocation)
        }
    }
}
