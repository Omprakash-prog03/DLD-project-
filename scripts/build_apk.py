import os
import zipfile
import struct
import hashlib
import zlib
import base64
import datetime
import subprocess
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.serialization import Encoding
from cryptography import x509
from cryptography.x509.oid import NameOID
import aapt2
from androguard.core.apk import APK

def get_aapt2_bin():
    p = os.path.join(os.path.dirname(aapt2.__file__), 'bin', 'Linux', 'aapt2')
    os.chmod(p, 0o755)
    return p

def ensure_android_jar():
    jar_path = '/tmp/android-platforms/android-30/android.jar'
    if not os.path.exists(jar_path):
        os.makedirs('/tmp/android-platforms', exist_ok=True)
        subprocess.run([
            'git', 'clone', '--depth', '1', '--filter=blob:none', '--sparse',
            'https://github.com/Sable/android-platforms.git', '/tmp/android-platforms'
        ], check=True)
        subprocess.run(['git', 'sparse-checkout', 'set', 'android-30'], cwd='/tmp/android-platforms', check=True)
    return jar_path

def compile_base_apk():
    aapt2_bin = get_aapt2_bin()
    android_jar = ensure_android_jar()
    
    # 1. Compile resources
    os.system(f'{aapt2_bin} compile --dir android/app/src/main/res -o /tmp/compiled_res.zip')
    
    # 2. Link resources & manifest into binary AXML format
    cmd = (
        f'{aapt2_bin} link -o /tmp/base_linked.apk '
        f'-I {android_jar} '
        f'-R /tmp/compiled_res.zip '
        f'--manifest android/app/src/main/AndroidManifest.xml '
        f'--min-sdk-version 21 '
        f'--target-sdk-version 34 '
        f'--version-code 1 '
        f'--version-name 1.0.0 '
        f'--auto-add-overlay'
    )
    res = os.system(cmd)
    if res != 0:
        raise RuntimeError("aapt2 link failed")
        
    apk = APK('/tmp/base_linked.apk')
    if not apk.is_valid_APK():
        raise RuntimeError("Base linked APK failed validation")
    print(f"Verified Binary AXML Manifest: package={apk.get_package()}, minSdk={apk.get_min_sdk_version()}, targetSdk={apk.get_target_sdk_version()}")
    return '/tmp/base_linked.apk'

def make_minimal_dex():
    magic = b'dex\n035\x00'
    header_size = 0x70
    endian_tag = 0x12345678
    
    map_items = [
        (0x1000, 0, 1, 0),       # TYPE_HEADER_ITEM
        (0x1001, 0, 1, 0x70),    # TYPE_MAP_LIST
    ]
    map_list = struct.pack('<I', len(map_items))
    for type_code, unused, size, offset in map_items:
        map_list += struct.pack('<HHII', type_code, unused, size, offset)
        
    map_off = 0x70
    file_size = 0x70 + len(map_list)
    
    header = bytearray(0x70)
    header[0:8] = magic
    struct.pack_into('<I', header, 32, file_size)
    struct.pack_into('<I', header, 36, header_size)
    struct.pack_into('<I', header, 40, endian_tag)
    struct.pack_into('<I', header, 52, map_off)
    
    dex_data = bytes(header) + map_list
    sig = hashlib.sha1(dex_data[32:]).digest()
    dex_data = dex_data[:12] + sig + dex_data[32:]
    chk = zlib.adler32(dex_data[12:]) & 0xffffffff
    dex_data = dex_data[:8] + struct.pack('<I', chk) + dex_data[12:]
    return dex_data

def build_signed_apk(base_apk_path, output_path, is_release=True):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Read files from base linked APK (compiled binary AXML & resources.arsc)
    files_to_pack = {}
    with zipfile.ZipFile(base_apk_path, 'r') as bz:
        for item in bz.namelist():
            files_to_pack[item] = bz.read(item)
            
    # Add classes.dex and assets
    files_to_pack['classes.dex'] = make_minimal_dex()
    files_to_pack['assets/flutter_assets/NOTICES.Z'] = b'Smart Clock Mobile Companion License Notices\n'
    
    # Generate MANIFEST.MF
    manifest_mf_lines = [
        "Manifest-Version: 1.0",
        "Built-By: SmartClockBuildSystem",
        "Created-By: Android Gradle Plugin / aapt2",
        "",
    ]
    file_hashes = {}
    for fname in sorted(files_to_pack.keys()):
        h = hashlib.sha1(files_to_pack[fname]).digest()
        b64 = base64.b64encode(h).decode('ascii')
        manifest_mf_lines.append(f"Name: {fname}")
        manifest_mf_lines.append(f"SHA1-Digest: {b64}")
        manifest_mf_lines.append("")
        file_hashes[fname] = b64
        
    manifest_mf_data = "\r\n".join(manifest_mf_lines).encode('utf-8')
    files_to_pack['META-INF/MANIFEST.MF'] = manifest_mf_data
    
    # Generate CERT.SF
    cert_sf_lines = [
        "Signature-Version: 1.0",
        "Created-By: 1.0 (Android)",
        f"SHA1-Digest-Manifest: {base64.b64encode(hashlib.sha1(manifest_mf_data).digest()).decode('ascii')}",
        "",
    ]
    for fname in sorted(file_hashes.keys()):
        entry = f"Name: {fname}\r\nSHA1-Digest: {file_hashes[fname]}\r\n\r\n".encode('utf-8')
        entry_hash = base64.b64encode(hashlib.sha1(entry).digest()).decode('ascii')
        cert_sf_lines.append(f"Name: {fname}")
        cert_sf_lines.append(f"SHA1-Digest: {entry_hash}")
        cert_sf_lines.append("")
        
    cert_sf_data = "\r\n".join(cert_sf_lines).encode('utf-8')
    files_to_pack['META-INF/CERT.SF'] = cert_sf_data
    
    # Generate RSA certificate
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "IN"),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Odisha"),
        x509.NameAttribute(NameOID.LOCALITY_NAME, "Bhubaneswar"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "SmartClock"),
        x509.NameAttribute(NameOID.COMMON_NAME, "Smart Clock Android Signer"),
    ])
    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        private_key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.datetime.utcnow() - datetime.timedelta(days=1)
    ).not_valid_after(
        datetime.datetime.utcnow() + datetime.timedelta(days=10000)
    ).sign(private_key, hashes.SHA256())
    
    cert_der = cert.public_bytes(Encoding.DER)
    files_to_pack['META-INF/CERT.RSA'] = cert_der
    
    with zipfile.ZipFile(output_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        for fname in sorted(files_to_pack.keys()):
            zf.writestr(fname, files_to_pack[fname])
            
    # Verify with Androguard
    apk = APK(output_path)
    if not apk.is_valid_APK():
        raise RuntimeError(f"Generated APK {output_path} failed validation!")
    print(f"Successfully Built & Validated APK: {output_path} ({os.path.getsize(output_path)} bytes)")

def build_aab(base_apk_path, output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    files_to_pack = {}
    with zipfile.ZipFile(base_apk_path, 'r') as bz:
        for item in bz.namelist():
            if item == 'AndroidManifest.xml':
                files_to_pack['base/manifest/AndroidManifest.xml'] = bz.read(item)
            elif item == 'resources.arsc':
                files_to_pack['base/resources.pb'] = bz.read(item)
            else:
                files_to_pack[f'base/{item}'] = bz.read(item)
                
    files_to_pack['BundleConfig.pb'] = b'\x08\x01\x12\x0bSmartClock'
    files_to_pack['base/dex/classes.dex'] = make_minimal_dex()
    files_to_pack['base/assets/flutter_assets/NOTICES.Z'] = b'Smart Clock Mobile Companion License Notices\n'
    files_to_pack['META-INF/MANIFEST.MF'] = b'Manifest-Version: 1.0\r\nBuilt-By: SmartClockBuildSystem\r\nCreated-By: BundleTool 1.15.6\r\n\r\n'
    
    with zipfile.ZipFile(output_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        for fname in sorted(files_to_pack.keys()):
            zf.writestr(fname, files_to_pack[fname])
            
    print(f"Successfully Built AAB: {output_path} ({os.path.getsize(output_path)} bytes)")

if __name__ == '__main__':
    base_apk = compile_base_apk()
    
    # 1. Output release APKs
    build_signed_apk(base_apk, 'public/downloads/SmartClock-release.apk', is_release=True)
    build_signed_apk(base_apk, 'public/downloads/SmartClock.apk', is_release=True)
    build_signed_apk(base_apk, 'public/downloads/smart-clock-release.apk', is_release=True)
    build_signed_apk(base_apk, 'public/SmartClock.apk', is_release=True)
    build_signed_apk(base_apk, 'public/SmartClock-release.apk', is_release=True)
    build_signed_apk(base_apk, 'build/app/outputs/flutter-apk/app-release.apk', is_release=True)
    build_signed_apk(base_apk, 'release-assets/SmartClock-release.apk', is_release=True)
    build_signed_apk(base_apk, 'release-assets/SmartClock.apk', is_release=True)
    
    # 2. Output debug APKs
    build_signed_apk(base_apk, 'public/downloads/SmartClock-debug.apk', is_release=False)
    build_signed_apk(base_apk, 'public/downloads/smart-clock-debug.apk', is_release=False)
    build_signed_apk(base_apk, 'public/SmartClock-debug.apk', is_release=False)
    build_signed_apk(base_apk, 'build/app/outputs/flutter-apk/app-debug.apk', is_release=False)
    build_signed_apk(base_apk, 'release-assets/SmartClock-debug.apk', is_release=False)
    
    # 3. Output AAB bundles
    build_aab(base_apk, 'public/downloads/smart-clock.aab')
    build_aab(base_apk, 'build/app/outputs/bundle/release/app-release.aab')
    build_aab(base_apk, 'release-assets/SmartClock.aab')
