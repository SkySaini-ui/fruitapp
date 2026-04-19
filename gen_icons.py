#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

os.makedirs('icons', exist_ok=True)

for size in [192, 512]:
    img = Image.new('RGB', (size, size), '#2d6a4f')
    draw = ImageDraw.Draw(img)
    # Draw a circle background
    margin = size // 8
    draw.ellipse([margin, margin, size-margin, size-margin], fill='#52b788')
    # Draw text
    font_size = size // 4
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
    except:
        font = ImageFont.load_default()
    text = '🥦'
    # fallback: draw FM letters
    text = 'FM'
    bbox = draw.textbbox((0,0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text(((size-tw)//2, (size-th)//2), text, fill='white', font=font)
    img.save(f'icons/icon-{size}.png')
    print(f'Created icon-{size}.png')
