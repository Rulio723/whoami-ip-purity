from PIL import Image
from collections import Counter
import sys

for p in sys.argv[1:]:
    im = Image.open(p).convert('RGB')
    print(p, im.size, Counter(im.getdata()).most_common(6))
    xs, ys = [], []
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = im.getpixel((x, y))
            if r < 30 and g < 30 and b < 30:
                xs.append(x)
                ys.append(y)
    print('black_bounds', (min(xs), min(ys), max(xs), max(ys)) if xs else None)
