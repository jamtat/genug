import os
import sys
import multiprocessing
from PIL import Image

im = Image.open('olivia.jpg')
im2 = Image.open('test.png')

# Per pixel transform of an image


def pixelTransform(image, *transforms):

	(w, h) = image.size
	outImg = Image.new('RGBA', image.size)
	outPixels = list(image.getdata())
	# Transforms
	for transform in transforms:
		for x in range(w):
			for y in range(h):
				outPixels[y * w + x] = tuple(transform(outPixels[y * w + x]))

	outImg.putdata( outPixels )

	return outImg


# Invert an image but preserve alpha
def invert(pixel):
	return [255 - i for i in pixel[:3]] + [(pixel[3] if len(pixel) > 3 else 255)]


# Invert the alpha channel
def invert_alpha(pixel):
	return list(pixel[:3]) + [255 - pixel[3]]


# Create a luminanace map of an image
def greyscale(pixel):
	intensity = int((pixel[0] + pixel[1] + pixel[2]) / 3)
	return [intensity] * 3


# Apply the luminance of a pixel as its alpha
def luma_map(pixel):
	intensity = int((pixel[0] + pixel[1] + pixel[2]) / 3)
	return ([0] * 3) + [intensity]


# Return a function that fills all pixels in an image with a colour
def fill(r=255, g=255, b=255):

	def do_fill(pixel):
		return [r, g, b] + [(pixel[3] if len(pixel) > 3 else 255)]

	return do_fill


pixelTransform( im, luma_map, invert_alpha, fill(0, 0, 255) ).save('out.png', 'PNG')
