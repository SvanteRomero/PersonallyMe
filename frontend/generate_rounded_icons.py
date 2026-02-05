import os
import sys
from PIL import Image, ImageDraw

def generate_rounded_icons(source_path, output_dir):
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    if not os.path.exists(source_path):
        print(f"Error: {source_path} not found.")
        return

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    original = Image.open(source_path).convert("RGBA")
    
    for size in sizes:
        # Resize first
        img = original.resize((size, size), Image.Resampling.LANCZOS)
        
        # Create a mask for rounded corners
        mask = Image.new('L', (size, size), 0)
        draw = ImageDraw.Draw(mask)
        
        # Radius of 20% seems good for "rounded kinda"
        radius = size // 5
        draw.rounded_rectangle([(0, 0), (size, size)], radius=radius, fill=255)
        
        # Apply mask
        output = Image.new('RGBA', (size, size))
        output.paste(img, (0, 0), mask=mask)
        
        icon_name = f"icon-{size}x{size}.png"
        output_path = os.path.join(output_dir, icon_name)
        output.save(output_path)
        print(f"Generated rounded {icon_name}")

if __name__ == "__main__":
    source = "public/icons/me.png"
    dest = "public/icons"
    generate_rounded_icons(source, dest)
