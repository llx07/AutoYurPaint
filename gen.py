import os
from PIL import Image
import numpy as np
import argparse

parser = argparse.ArgumentParser(description="Change the picture to JS")
parser.add_argument("path")
parser.add_argument("--width",type=int)
parser.add_argument("--height",type=int)

args = parser.parse_args()

img_path = args.path


img = Image.open(img_path)
if img.mode!="RGB":
    img=img.convert("RGB")

if args.width is not None and args.height is not None:
    img=img.resize((args.width,args.height))
elif args.width is not None:
    img=img.resize((args.width,int(img.size[1]*args.width/img.size[0])))
elif args.height is not None:
    img=img.resize((int(img.size[0]*args.height/img.size[1]),args.height))

print("[INFO]Size is ({},{})".format(*img.size))
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