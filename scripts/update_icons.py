import json
import os
import subprocess
import sys

# Configuration
SOURCE_IMAGE = "src/assets/Drinkig-App-Logo.png"
IOS_CONFIG_PATH = "ios/drinkigclientcn/Images.xcassets/AppIcon.appiconset/Contents.json"
IOS_ICON_DIR = "ios/drinkigclientcn/Images.xcassets/AppIcon.appiconset"
ANDROID_RES_DIR = "android/app/src/main/res"

ANDROID_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

def run_sips(source, dest, width, height):
    try:
        subprocess.check_call([
            "sips",
            "-z", str(height), str(width),
            source,
            "--out", dest
        ])
    except subprocess.CalledProcessError as e:
        print(f"Error resizing {source} to {dest}: {e}")
        sys.exit(1)

def generate_ios_icons():
    print("Generating iOS icons...")
    with open(IOS_CONFIG_PATH, 'r') as f:
        config = json.load(f)

    for image in config.get("images", []):
        filename = image.get("filename")
        if not filename:
            continue
            
        # dimensions
        size_str = image.get("size", "0x0") # e.g. "60x60"
        scale_str = image.get("scale", "1x") # e.g. "3x"
        
        try:
            width_pt, height_pt = map(float, size_str.split('x'))
            scale = float(scale_str.rstrip('x'))
            
            width_px = int(width_pt * scale)
            height_px = int(height_pt * scale)
            
            dest_path = os.path.join(IOS_ICON_DIR, filename)
            
            # Ensure directory exists (it should, but just in case)
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            
            print(f"  {filename} ({width_px}x{height_px})")
            run_sips(SOURCE_IMAGE, dest_path, width_px, height_px)
            
        except ValueError:
            print(f"Skipping invalid size/scale: {size_str} @ {scale_str}")

def generate_android_icons():
    print("Generating Android icons...")
    # Check if round icons should be generated (based on file existence check passed in args if needed, 
    # but for now we will just generate standard launcher icons. 
    # If the user has round icons configured in manifest, we should probably generate them too.)
    
    # We will generate both ic_launcher.png and ic_launcher_round.png for each density
    
    for folder, size in ANDROID_SIZES.items():
        dir_path = os.path.join(ANDROID_RES_DIR, folder)
        os.makedirs(dir_path, exist_ok=True)
        
        # Standard Icon
        dest_path = os.path.join(dir_path, "ic_launcher.png")
        print(f"  {folder}/ic_launcher.png ({size}x{size})")
        run_sips(SOURCE_IMAGE, dest_path, size, size)
        
        # Round Icon (Simple resize for now, ideally should be masked circular but sips resize is square)
        # Often round icons are just the same image in a round mask. 
        # Since I cannot easily apply a mask with just sips without complex script, 
        # I will generate the square icon as the round icon too, asking forgiveness. 
        # However, typically round icons on Android are circular.
        # Let's generate it as square for now to ensure the file exists and is updated.
        dest_path_round = os.path.join(dir_path, "ic_launcher_round.png")
        print(f"  {folder}/ic_launcher_round.png ({size}x{size})")
        run_sips(SOURCE_IMAGE, dest_path_round, size, size)

def main():
    if not os.path.exists(SOURCE_IMAGE):
        print(f"Source image not found: {SOURCE_IMAGE}")
        sys.exit(1)
        
    generate_ios_icons()
    generate_android_icons()
    print("Done.")

if __name__ == "__main__":
    main()
