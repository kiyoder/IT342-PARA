plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.example.para_mobile"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.example.para_mobile"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions {
        jvmTarget = "11"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.appcompat)

    // OSMDroid for OpenStreetMap
    implementation (libs.osmdroid.android)

    // Google Play Services for location services (to get user location)
    implementation (libs.play.services.location)

    // Retrofit for networking and calling APIs (like Nominatim API)
    implementation (libs.retrofit)

    // Gson Converter for Retrofit to parse JSON responses
    implementation (libs.converter.gson)

    // Logging Interceptor for Retrofit to log API requests/responses
    implementation (libs.logging.interceptor)

    // Material UI for Android to follow Material Design guidelines
    implementation (libs.material)

    // AndroidX Activity - Provides Activity-related components
    implementation (libs.androidx.activity.ktx)

    // AndroidX ConstraintLayout - Layout manager for flexible and responsive UIs
    implementation (libs.androidx.constraintlayout)

    implementation (libs.androidx.drawerlayout) //drawer navigation

    implementation (libs.play.services.location.v2101)

    // Lifecycle components (for lifecycleScope)
    implementation (libs.androidx.lifecycle.runtime.ktx.v241)

    // Kotlin coroutines for delay and other coroutine features
    implementation (libs.kotlinx.coroutines.android)

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.ui.test.junit4)
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)



}