#!/usr/bin/env bash
set -e

echo "=== Building Embedded Offline-First Universal Android APK for JIT PREDICTION ==="

BUILD_DIR="/tmp/jit_build_flawless"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"/{res/values,res/drawable,res/drawable-hdpi,res/drawable-xhdpi,res/drawable-xxhdpi,src/com/jitprediction/app,classes,gen,assets}

OUT_DIR="public/downloads"
mkdir -p "$OUT_DIR"

# Ensure frontend is built with relative base paths for embedded APK assets
VITE_APP_TARGET=apk npm run build

# Copy complete built web app into assets (index.html, JS, CSS, icons, logo)
cp -r dist/* "$BUILD_DIR/assets/"

# Re-build for web server with standard root base ('/')
npm run build

ANDROID_JAR="/tmp/android.jar"
if [ ! -f "$ANDROID_JAR" ]; then
    echo "Downloading API 30 android.jar..."
    curl -sSL -o "$ANDROID_JAR" "https://github.com/Sable/android-platforms/raw/master/android-30/android.jar"
fi

# 1. Copy JIT Logo to all drawable folders
cp public/jit-logo.png "$BUILD_DIR/res/drawable/ic_launcher.png"
cp public/jit-logo.png "$BUILD_DIR/res/drawable-hdpi/ic_launcher.png"
cp public/jit-logo.png "$BUILD_DIR/res/drawable-xhdpi/ic_launcher.png"
cp public/jit-logo.png "$BUILD_DIR/res/drawable-xxhdpi/ic_launcher.png"

# 2. strings.xml
cat << 'EOF' > "$BUILD_DIR/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">JIT PREDICTION</string>
</resources>
EOF

# 3. AndroidManifest.xml
cat << 'EOF' > "$BUILD_DIR/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.jitprediction.app"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-sdk
        android:minSdkVersion="21"
        android:targetSdkVersion="30" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:label="@string/app_name"
        android:icon="@drawable/ic_launcher"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true"
        android:theme="@android:style/Theme.Black.NoTitleBar.Fullscreen">

        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:icon="@drawable/ic_launcher"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:exported="true"
            android:launchMode="singleTask">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# 4. MainActivity.java - Loads bundled offline-first application from local assets
cat << 'EOF' > "$BUILD_DIR/src/com/jitprediction/app/MainActivity.java"
package com.jitprediction.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.graphics.Color;

public class MainActivity extends Activity {
    private WebView mWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);

        mWebView = new WebView(this);
        mWebView.setBackgroundColor(Color.parseColor("#070A11"));

        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setDisplayZoomControls(false);

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });
        mWebView.setWebChromeClient(new WebChromeClient());

        setContentView(mWebView);
        // Load bundled standalone offline-first web app directly from APK assets
        mWebView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        if (mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
EOF

# 5. Compile resources with aapt2
echo "⚙️ Compiling resources with aapt2..."
aapt2 compile --dir "$BUILD_DIR/res" -o "$BUILD_DIR/compiled_res.zip"

echo "🔗 Linking resources, manifest, and assets with aapt2..."
aapt2 link "$BUILD_DIR/compiled_res.zip" \
    -I "$ANDROID_JAR" \
    -A "$BUILD_DIR/assets" \
    --manifest "$BUILD_DIR/AndroidManifest.xml" \
    --min-sdk-version 21 \
    --target-sdk-version 30 \
    --compile-sdk-version-code 30 \
    --compile-sdk-version-name "11" \
    --version-code 1 \
    --version-name "1.0.0" \
    --auto-add-overlay \
    -o "$BUILD_DIR/unaligned_no_dex.apk" \
    --java "$BUILD_DIR/gen"

# 6. Compile Java sources
echo "☕ Compiling Java sources..."
javac -source 1.8 -target 1.8 \
    -cp "$ANDROID_JAR" \
    -d "$BUILD_DIR/classes" \
    "$BUILD_DIR/src/com/jitprediction/app/MainActivity.java" \
    "$BUILD_DIR/gen/com/jitprediction/app/R.java"

# 7. Convert classes to Dalvik executable
echo "⚡ Converting bytecode to classes.dex with dalvik-exchange..."
dalvik-exchange --dex --output="$BUILD_DIR/classes.dex" "$BUILD_DIR/classes"

# 8. Copy unaligned APK and inject classes.dex with zip
cp "$BUILD_DIR/unaligned_no_dex.apk" "$BUILD_DIR/unaligned_with_dex.apk"
cd "$BUILD_DIR"
zip -0 -u unaligned_with_dex.apk classes.dex
cd - >/dev/null

# 9. 4-byte zipalign
echo "📐 Zipaligning APK to 4-byte boundaries..."
zipalign -f -p 4 "$BUILD_DIR/unaligned_with_dex.apk" "$BUILD_DIR/aligned.apk"

# 10. Generate RSA 2048-bit release keystore with startdate in 2020 (Valid 2020-2047!)
KEYSTORE="/tmp/jit_release_flawless.keystore"
if [ ! -f "$KEYSTORE" ]; then
    echo "🔑 Generating release keystore with startdate=2020 (immediately valid on all real phones)..."
    keytool -genkeypair -v \
        -keystore "$KEYSTORE" \
        -alias jitkey \
        -keyalg RSA \
        -keysize 2048 \
        -startdate "2020/01/01 00:00:00" \
        -validity 10000 \
        -storepass "jitprediction123" \
        -keypass "jitprediction123" \
        -dname "CN=JIT PREDICTION, OU=Jharna Institute of Technology, O=JIT, L=Kolkata, ST=West Bengal, C=IN"
fi

# 11. Sign with apksigner (v1, v2, and v3 schemes all enabled!)
echo "✍️ Signing APK with apksigner..."
FINAL_APK="$OUT_DIR/JIT_PREDICTION_Universal.apk"
apksigner sign \
    --ks "$KEYSTORE" \
    --ks-key-alias "jitkey" \
    --ks-pass "pass:jitprediction123" \
    --key-pass "pass:jitprediction123" \
    --min-sdk-version 21 \
    --v1-signing-enabled true \
    --v2-signing-enabled true \
    --v3-signing-enabled true \
    --out "$FINAL_APK" \
    "$BUILD_DIR/aligned.apk"

# 12. Verify APK signature
echo "🔍 Verifying signature with apksigner..."
apksigner verify --verbose "$FINAL_APK"

echo "📱 Checking APK badging..."
aapt dump badging "$FINAL_APK"

# Sync to dist as well
mkdir -p dist/downloads
cp "$FINAL_APK" dist/downloads/JIT_PREDICTION_Universal.apk

APK_SIZE=$(ls -lh "$FINAL_APK" | awk '{print $5}')
echo "🎉 SUCCESS: Flawless Embedded Standalone Android APK ready at $FINAL_APK ($APK_SIZE)"
