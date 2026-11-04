@rem
@rem Gradle startup script for Windows — Shredder Live Cohost Android APK
@rem
@if "%DEBUG%"=="" @echo off
set DIRNAME=%~dp0
if "%DIRNAME%"=="" set DIRNAME=.
set APP_HOME=%DIRNAME%
set WRAPPER_JAR=%APP_HOME%\gradle\wrapper\gradle-wrapper.jar

where gradle >nul 2>nul
if %ERRORLEVEL% equ 0 (
    gradle %*
    exit /b %ERRORLEVEL%
)

if exist "%WRAPPER_JAR%" (
    java -Xmx64m -Xms64m -jar "%WRAPPER_JAR%" %*
    exit /b %ERRORLEVEL%
)

echo Open android-app in Android Studio or install Gradle CLI to run assembleDebug.
exit /b 1
