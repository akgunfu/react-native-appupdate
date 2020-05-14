"use strict";

import { NativeModules } from "react-native";
import RNFS from "react-native-fs";

const RNAppUpdate = NativeModules.RNAppUpdate;

let jobId = -1;

class AppUpdate {
  constructor(options) {
    this.options = options;
  }

  GET(url, success, error) {
    fetch(url, { cache: "no-cache" })
      .then(response => response.json())
      .then(json => success && success(json))
      .catch(err => error && error(err));
  }

  getApkVersion() {
    if (jobId !== -1) {
      return;
    }
    if (!this.options.apkVersionUrl) {
      console.log("apkVersionUrl doesn't exist.");
      return;
    }
    this.GET(
      this.options.apkVersionUrl,
      this.getApkVersionSuccess.bind(this),
      this.getVersionError.bind(this)
    );
  }

  getApkVersionSuccess(remote) {
    console.log("getApkVersionSuccess", remote);
    if (RNAppUpdate.versionName < remote.versionName) {
      if (remote.forceUpdate) {
        if (this.options.forceUpdateApp) {
          this.options.forceUpdateApp();
        }
        this.downloadApk(remote);
      } else if (this.options.needUpdateApp) {
        this.options.needUpdateApp(remote, isUpdate => {
          if (isUpdate) {
            this.downloadApk(remote);
          }
        });
      }
    } else if (this.options.notNeedUpdateApp) {
      this.options.notNeedUpdateApp();
    }
  }

  downloadApk(remote) {
    const progress = data => {
      const percentage = ((100 * data.bytesWritten) / data.contentLength) | 0;
      this.options.downloadApkProgress &&
        this.options.downloadApkProgress(percentage);
    };
    const begin = () => {
      console.log("downloadApkStart");
      this.options.downloadApkStart && this.options.downloadApkStart();
    };
    const progressDivider = 1;
    const downloadDestPath = `${RNFS.DocumentDirectoryPath}/NewApp.apk`;

    const remoteUrl = remote.apkUrl || "";
    const url = this.options.useHttps
      ? remoteUrl.replace("http", "https")
      : remoteUrl;
    console.log("used url", url);
    const ret = RNFS.downloadFile({
      fromUrl: url,
      toFile: downloadDestPath,
      begin,
      progress,
      background: true,
      progressDivider
    });
    jobId = ret.jobId;

    ret.promise
      .then(() => {
        console.log("downloadApkEnd");
        this.options.downloadApkEnd && this.options.downloadApkEnd();
        RNAppUpdate.installApk(downloadDestPath);
        jobId = -1;
      })
      .catch(err => {
        this.downloadApkError(err);
        jobId = -1;
      });
  }

  getVersionError(err) {
    console.log("getVersionError", err);
  }

  downloadApkError(err) {
    console.log("downloadApkError", err);
    this.options.onError && this.options.onError();
  }

  checkUpdate() {
    this.getApkVersion();
  }
}

export default AppUpdate;
