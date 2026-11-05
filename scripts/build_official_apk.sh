#!/usr/bin/env bash
set -e

echo "=== Building 100% Genuine Android APK for JIT PREDICTION ==="

BUILD_DIR="build_android"
OUT_DIR="public/downloads"
mkdir -p "$BUILD_DIR/src/com/jitprediction/app"
mkdir -p "$BUILD_DIR/res/drawable-hdpi"
mkdir -p "$BUILD_DIR/res/drawable-xhdpi"
mkdir -p "$BUILD_DIR/res/drawable-xxhdpi"
mkdir -p "$BUILD_DIR/res/values"
mkdir -p "$BUILD_DIR/assets"
mkdir -p "$OUT_DIR"

ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"

# 1. Copy Logo into all drawable folders
cp public/jit-logo.png "$BUILD_DIR/res/drawable-hdpi/ic_launcher.png"
cp public/jit-logo.png "$BUILD_DIR/res/drawable-xhdpi/ic_launcher.png"
cp public/jit-logo.png "$BUILD_DIR/res/drawable-xxhdpi/ic_launcher.png"

# 2. Create strings.xml & styles.xml
cat << 'EOF' > "$BUILD_DIR/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">JIT PREDICTION</string>
</resources>
EOF

cat << 'EOF' > "$BUILD_DIR/res/values/styles.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="@android:style/Theme.NoTitleBar.Fullscreen">
        <item name="android:windowBackground">@android:color/black</item>
    </style>
</resources>
EOF

# 3. Create AndroidManifest.xml (Universal compatibility Android 8.0 to Android 15+)
cat << 'EOF' > "$BUILD_DIR/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.jitprediction.app"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-sdk
        android:minSdkVersion="21"
        android:targetSdkVersion="34" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:label="@string/app_name"
        android:icon="@drawable/ic_launcher"
        android:theme="@style/AppTheme"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true"
        android:allowBackup="true">

        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
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

# 4. Create Native MainActivity.java
cat << 'EOF' > "$BUILD_DIR/src/com/jitprediction/app/MainActivity.java"
package com.jitprediction.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.graphics.Color;

public class MainActivity extends Activity {
    private WebView mWebView;
    private ProgressBar mProgressBar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Fullscreen configuration for trading terminal
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#070A11"));

        mWebView = new WebView(this);
        mWebView.setBackgroundColor(Color.parseColor("#070A11"));
        
        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);

        mProgressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        mProgressBar.setLayoutParams(new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, 8
        ));
        mProgressBar.setMax(100);

        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress == 100) {
                    mProgressBar.setVisibility(View.GONE);
                } else {
                    mProgressBar.setVisibility(View.VISIBLE);
                    mProgressBar.setProgress(newProgress);
                }
            }
        });

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });

        // App development and production hosted URL
        String targetUrl = "https://ais-dev-og4sx4dwg4um2p76skqtqh-990009967531.asia-east1.run.app";
        mWebView.loadUrl(targetUrl);

        root.addView(mWebView, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT
        ));
        root.addView(mProgressBar);

        setContentView(root);
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

# 5. Compile Java source to bytecode with javac (target Java 8 for Dalvik compatibility)
echo "Compiling Java sources..."
mkdir -p "$BUILD_DIR/classes"
javac -source 1.8 -target 1.8 -cp "$ANDROID_JAR" -d "$BUILD_DIR/classes" "$BUILD_DIR/src/com/jitprediction/app/MainActivity.java"

# 6. Convert bytecode to Dalvik executable classes.dex with dalvik-exchange
echo "Converting classes to Dalvik classes.dex..."
dalvik-exchange --dex --output="$BUILD_DIR/classes.dex" "$BUILD_DIR/classes"

# 7. Package resources with aapt
echo "Compiling resources with aapt..."
aapt package -f -m \
    -M "$BUILD_DIR/AndroidManifest.xml" \
    -S "$BUILD_DIR/res" \
    -I "$ANDROID_JAR" \
    -F "$BUILD_DIR/unaligned_unsigned.apk"

# 8. Add classes.dex into the APK
cd "$BUILD_DIR"
aapt add unaligned_unsigned.apk classes.dex
cd ..

# 9. Create keystore if not exists
KEYSTORE="jit_release.keystore"
if [ ! -f "$KEYSTORE" ]; then
    echo "Creating Android release keystore..."
    keytool -genkeypair -v \
        -keystore "$KEYSTORE" \
        -alias jitkey \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass jitpredict123 \
        -keypass jitpredict123 \
        -dname "CN=JIT PREDICTION, OU=Mobile, O=Jharna Institute of Technology, C=IN"
fi

# 10. Align APK with zipalign (4-byte boundary)
echo "Aligning APK with zipalign..."
zipalign -f -p 4 "$BUILD_DIR/unaligned_unsigned.apk" "$BUILD_DIR/aligned_unsigned.apk"

# 11. Sign APK with apksigner (v1 + v2 + v3 scheme)
echo "Signing APK with apksigner..."
apksigner sign \
    --ks "$KEYSTORE" \
    --ks-key-alias jitkey \
    --ks-pass pass:jitpredict123 \
    --key-pass pass:jitpredict123 \
    --out "$OUT_DIR/JIT_PREDICTION_Universal.apk" \
    "$BUILD_DIR/aligned_unsigned.apk"

# 12. Verify APK with apksigner
echo "Verifying APK..."
apksigner verify --verbose "$OUT_DIR/JIT_PREDICTION_Universal.apk"

echo "=== BUILD COMPLETE! Signed Universal APK ready at: $OUT_DIR/JIT_PREDICTION_Universal.apk ==="
ls -lh "$OUT_DIR/JIT_PREDICTION_Universal.apk"
