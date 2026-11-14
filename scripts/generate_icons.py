from PIL import Image, ImageDraw

def create_app_icon(size):
    # Background #111111
    img = Image.new('RGBA', (size, size), (17, 17, 17, 255))
    draw = ImageDraw.Draw(img)
    
    # Outer rounded card in primary red-orange #E84B2F
    padding = size * 0.1
    radius = size * 0.22
    card_box = [padding, padding, size - padding, size - padding]
    draw.rounded_rectangle(card_box, radius=int(radius), fill=(232, 75, 47, 255))
    
    # Clock circle in white
    cx, cy = size / 2, size / 2
    r = size * 0.28
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 255, 255, 255), width=int(size * 0.04))
    
    # Center dot
    dot_r = size * 0.03
    draw.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=(255, 255, 255, 255))
    
    # Clock hands: hour hand (pointing to 10), minute hand (pointing to 2)
    # Hour hand
    hx = cx - size * 0.12
    hy = cy - size * 0.12
    draw.line([cx, cy, hx, hy], fill=(255, 255, 255, 255), width=int(size * 0.04), joint="curve")
    
    # Minute hand
    mx = cx + size * 0.17
    my = cy - size * 0.08
    draw.line([cx, cy, mx, my], fill=(255, 255, 255, 255), width=int(size * 0.03), joint="curve")
    
    return img

for sz in [192, 512, 1024]:
    icon = create_app_icon(sz)
    icon.save(f'public/icons/icon-{sz}.png', 'PNG')

# Also create favicon
icon_64 = create_app_icon(64)
icon_64.save('public/icons/favicon.png', 'PNG')
print('Generated icons: 192, 512, 1024, favicon')
