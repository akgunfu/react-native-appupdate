package com.parryworld.rnappupdate;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.support.v4.content.FileProvider;
import android.util.Log;

import java.io.File;

public class ApkInstaller {

    public static void installApplication(Context reactContext, String filePath) {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.addCategory("android.intent.category.DEFAULT");
        intent.setDataAndType(uriFromFile(reactContext, filePath), "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try {
            reactContext.startActivity(intent);
        } catch (ActivityNotFoundException e) {
            e.printStackTrace();
            Log.e("TAG", "Error in opening the file!");
        }
    }

    private static Uri uriFromFile(Context context, String filePath) {
        File file = new File(filePath);
        if (Build.VERSION.SDK_INT >= 24) {
            String packageName = context.getApplicationInfo().packageName;
            String authority = packageName + ".provider";
            return FileProvider.getUriForFile(context, authority, file);
        } else {
            String cmd = "chmod 777 " + filePath;
            try {
                Runtime.getRuntime().exec(cmd);
            } catch(Exception e){
                e.printStackTrace();
            }
            return Uri.fromFile(file);
        }
    }
}
