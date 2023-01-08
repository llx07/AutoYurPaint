import os
from PIL import Image
import numpy as np

img_path = "maintain.png"

img = Image.open(img_path)
if img.mode!="RGB":
    img=img.convert("RGB")
img=np.array(img)

out = "data.js"
with open(out,"w") as f:
    f.write("module.exports=[")
    for i in range(img.shape[0]):
        f.write("[")
        for j in range(img.shape[1]):
            f.write("[{},{},{}],".format(*img[i][j]))
        f.write("],\n")

    f.write("]")