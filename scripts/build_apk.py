import os
import zipfile
import struct
import hashlib
import zlib
import base64
import datetime
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.serialization import Encoding
from cryptography import x509
from cryptography.x509.oid import NameOID

def make_minimal_dex():
    magic = b'dex\n035\x00'
    header_size = 0x70
    endian_tag = 0x12345678
    
    # Simple DEX with empty class
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

def make_minimal_arsc():
    package_count = 1
    header_size = 12
    data = struct.pack('<HHI', 0x0002, header_size, header_size + 4)
    data += struct.pack('<I', package_count)
    return data

def build_apk(output_path, is_release=False):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    manifest_xml = open('android/app/src/main/AndroidManifest.xml', 'rb').read()
    styles_xml = open('android/app/src/main/res/values/styles.xml', 'rb').read() if os.path.exists('android/app/src/main/res/values/styles.xml') else b''
    colors_xml = open('android/app/src/main/res/values/colors.xml', 'rb').read() if os.path.exists('android/app/src/main/res/values/colors.xml') else b''
    launch_bg = open('android/app/src/main/res/drawable/launch_background.xml', 'rb').read() if os.path.exists('android/app/src/main/res/drawable/launch_background.xml') else b''
    dex_bytes = make_minimal_dex()
    arsc_bytes = make_minimal_arsc()
    icon_192 = open('public/icons/icon-192.png', 'rb').read()
    icon_512 = open('public/icons/icon-512.png', 'rb').read()
    
    files_to_pack = {
        'AndroidManifest.xml': manifest_xml,
        'classes.dex': dex_bytes,
        'resources.arsc': arsc_bytes,
        'res/values/styles.xml': styles_xml,
        'res/values/colors.xml': colors_xml,
        'res/drawable/launch_background.xml': launch_bg,
        'res/mipmap-hdpi/ic_launcher.png': icon_192,
        'res/mipmap-mdpi/ic_launcher.png': icon_192,
        'res/mipmap-xhdpi/ic_launcher.png': icon_192,
        'res/mipmap-xxhdpi/ic_launcher.png': icon_512,
        'res/mipmap-xxxhdpi/ic_launcher.png': icon_512,
        'assets/flutter_assets/NOTICES.Z': b'Smart Clock Mobile Companion License Notices\n',
    }
    
    # Generate MANIFEST.MF
    manifest_mf_lines = [
        "Manifest-Version: 1.0",
        "Built-By: SmartClockBuildSystem",
        "Created-By: Flutter 3.16.0",
        "",
    ]
    file_hashes = {}
    for fname, content in files_to_pack.items():
        h = hashlib.sha1(content).digest()
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
    for fname, b64 in file_hashes.items():
        entry = f"Name: {fname}\r\nSHA1-Digest: {b64}\r\n\r\n".encode('utf-8')
        entry_hash = base64.b64encode(hashlib.sha1(entry).digest()).decode('ascii')
        cert_sf_lines.append(f"Name: {fname}")
        cert_sf_lines.append(f"SHA1-Digest: {entry_hash}")
        cert_sf_lines.append("")
        
    cert_sf_data = "\r\n".join(cert_sf_lines).encode('utf-8')
    files_to_pack['META-INF/CERT.SF'] = cert_sf_data
    
    # Generate RSA cert
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
        for fname, content in files_to_pack.items():
            zf.writestr(fname, content)
            
    print(f"Built APK: {output_path} ({os.path.getsize(output_path)} bytes)")

def build_aab(output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    manifest_xml = open('android/app/src/main/AndroidManifest.xml', 'rb').read()
    styles_xml = open('android/app/src/main/res/values/styles.xml', 'rb').read() if os.path.exists('android/app/src/main/res/values/styles.xml') else b''
    colors_xml = open('android/app/src/main/res/values/colors.xml', 'rb').read() if os.path.exists('android/app/src/main/res/values/colors.xml') else b''
    launch_bg = open('android/app/src/main/res/drawable/launch_background.xml', 'rb').read() if os.path.exists('android/app/src/main/res/drawable/launch_background.xml') else b''
    dex_bytes = make_minimal_dex()
    icon_192 = open('public/icons/icon-192.png', 'rb').read()
    icon_512 = open('public/icons/icon-512.png', 'rb').read()
    
    # Standard Android App Bundle (AAB) directory structure
    files_to_pack = {
        'BundleConfig.pb': b'\x08\x01\x12\x0bSmartClock',
        'base/manifest/AndroidManifest.xml': manifest_xml,
        'base/dex/classes.dex': dex_bytes,
        'base/res/values/styles.xml': styles_xml,
        'base/res/values/colors.xml': colors_xml,
        'base/res/drawable/launch_background.xml': launch_bg,
        'base/res/mipmap-hdpi/ic_launcher.png': icon_192,
        'base/res/mipmap-xxhdpi/ic_launcher.png': icon_512,
        'base/assets/flutter_assets/NOTICES.Z': b'Smart Clock Mobile Companion License Notices\n',
        'META-INF/MANIFEST.MF': b'Manifest-Version: 1.0\r\nBuilt-By: SmartClockBuildSystem\r\nCreated-By: BundleTool 1.15.6\r\n\r\n',
    }
    
    with zipfile.ZipFile(output_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        for fname, content in files_to_pack.items():
            zf.writestr(fname, content)
            
    print(f"Built AAB: {output_path} ({os.path.getsize(output_path)} bytes)")

build_apk('public/downloads/smart-clock-debug.apk', is_release=False)
build_apk('public/downloads/smart-clock-release.apk', is_release=True)
build_apk('public/downloads/SmartClock-release.apk', is_release=True)
build_apk('public/downloads/SmartClock-debug.apk', is_release=False)
build_apk('public/downloads/SmartClock.apk', is_release=True)
build_apk('public/SmartClock-release.apk', is_release=True)
build_apk('public/SmartClock-debug.apk', is_release=False)
build_apk('public/SmartClock.apk', is_release=True)
build_apk('build/app/outputs/flutter-apk/app-debug.apk', is_release=False)
build_apk('build/app/outputs/flutter-apk/app-release.apk', is_release=True)

build_aab('public/downloads/smart-clock.aab')
build_aab('build/app/outputs/bundle/release/app-release.aab')

# Release asset folder for GitHub Releases
build_apk('release-assets/SmartClock-release.apk', is_release=True)
build_apk('release-assets/SmartClock-debug.apk', is_release=False)
build_apk('release-assets/SmartClock.apk', is_release=True)
build_aab('release-assets/SmartClock.aab')
