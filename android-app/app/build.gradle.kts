plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.beatshredder.cohost"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.beatshredder.cohost"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        // Default live server endpoint for Gemini Live WebSocket proxy (can be overridden in UI)
        buildConfigField(
            "String",
            "DEFAULT_SERVER_URL",
            "\"https://ais-pre-3fvppdbryajysg5ssuoocf-232251315435.us-west2.run.app\""
        )
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Uses debug signing config by default so assembleRelease produces an installable APK out-of-the-box
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    sourceSets {
        getByName("main") {
            assets.srcDirs("src/main/assets")
        }
    }
}

// Automatically sync compiled Vite web bundle (../dist) into Android assets before packaging APK
val syncWebDistAssets by tasks.registering(Copy::class) {
    val webDistDir = file("${rootProject.projectDir}/../dist")
    if (webDistDir.exists()) {
        from(webDistDir)
        into(file("${projectDir}/src/main/assets/public"))
    }
}

tasks.named("preBuild") {
    dependsOn(syncWebDistAssets)
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.webkit:webkit:1.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
}
