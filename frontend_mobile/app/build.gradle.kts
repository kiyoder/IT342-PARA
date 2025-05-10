import java.util.Properties
import java.io.FileInputStream

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    id("org.jetbrains.kotlin.plugin.serialization") version "1.9.0" // Kotlin Serialization version
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

        // Create a Properties object and load values from local.properties
        val properties = Properties()
        // Use FileInputStream to load properties from local.properties
        properties.load(FileInputStream(project.rootProject.file("local.properties")))

        // Set values in BuildConfig
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"${properties.getProperty("SUPABASE_ANON_KEY")}\"")
        buildConfigField("String", "SECRET", "\"${properties.getProperty("SECRET")}\"")
        buildConfigField("String", "SUPABASE_URL", "\"${properties.getProperty("SUPABASE_URL")}\"")
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
        buildConfig = true // ✅ This enables BuildConfig fields like SUPABASE_URL
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

    implementation (libs.play.services.auth) //google

    implementation (libs.gotrue.kt)

    implementation ("com.github.bumptech.glide:glide:4.16.0")
    annotationProcessor ("com.github.bumptech.glide:compiler:4.16.0")
    implementation("androidx.biometric:biometric:1.1.0")

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.ui.test.junit4)
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)



}

