package com.smartclock.mobile.hardware;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import io.flutter.plugin.common.MethodChannel;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Direct Local Wi-Fi HTTP / REST Transport Manager (Java).
 * 
 * Communicates directly over the local network (SoftAP default 192.168.4.1:80
 * or mDNS hostname http://esp32-clock.local:80) without requiring cloud connectivity.
 */
public class WifiTransportManager {
    private final Context context;
    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private static final int DEFAULT_TIMEOUT_MS = 4000;

    public WifiTransportManager(Context context) {
        this.context = context;
    }

    public void sendPost(String endpointUrl, String jsonBody, MethodChannel.Result result) {
        executor.execute(() -> {
            HttpURLConnection conn = null;
            try {
                URL url = new URL(endpointUrl);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("Accept", "application/json");
                conn.setConnectTimeout(DEFAULT_TIMEOUT_MS);
                conn.setReadTimeout(DEFAULT_TIMEOUT_MS);
                conn.setDoOutput(true);

                if (jsonBody != null) {
                    byte[] input = jsonBody.getBytes(StandardCharsets.UTF_8);
                    try (OutputStream os = conn.getOutputStream()) {
                        os.write(input, 0, input.length);
                    }
                }

                int code = conn.getResponseCode();
                if (code >= 200 && code < 300) {
                    StringBuilder response = new StringBuilder();
                    try (BufferedReader br = new BufferedReader(
                            new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                        String line;
                        while ((line = br.readLine()) != null) {
                            response.append(line.trim());
                        }
                    }
                    mainHandler.post(() -> result.success(response.toString()));
                } else {
                    mainHandler.post(() -> result.error("HTTP_" + code, "Server returned HTTP status " + code, null));
                }
            } catch (Exception e) {
                mainHandler.post(() -> result.error("ERR_2002", "Wi-Fi connection error: " + e.getMessage(), null));
            } finally {
                if (conn != null) {
                    conn.disconnect();
                }
            }
        });
    }
}
