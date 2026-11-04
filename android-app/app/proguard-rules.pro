# ProGuard rules for Shredder Live Cohost (Beatshredder) APK
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.beatshredder.cohost.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**
