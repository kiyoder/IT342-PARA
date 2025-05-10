package com.example.para_mobile

import android.app.Application

class ParaMobileApp : Application() {
    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    companion object {
        lateinit var instance: ParaMobileApp
            private set
    }
} 