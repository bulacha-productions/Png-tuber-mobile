/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { ANDROID_PROJECT_FILES } from '../androidCode/sourceCode.ts';

export async function downloadAndroidZip(): Promise<void> {
  const zip = new JSZip();

  // Root settings and gradle
  zip.file(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "PNGTuberRecorder"
include(":app")
`
  );

  zip.file(
    'build.gradle.kts',
    `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
`
  );

  zip.file(
    'gradle.properties',
    `# Project-wide Gradle settings.
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`
  );

  zip.file(
    'gradle/wrapper/gradle-wrapper.properties',
    `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`
  );

  zip.file(
    'gradlew',
    `#!/bin/sh
exec gradle "$@"
`
  );

  // Add all project files (including .github/workflows/build-apk.yml)
  ANDROID_PROJECT_FILES.forEach((file) => {
    zip.file(file.path, file.content);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'PNGTuber-Recorder-Android-Project.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
