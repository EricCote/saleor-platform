this was to test some middleware for the images. Finally, this code is not needed, the problem was about images pointing another machine using containers, but when deployed on a local container, it would not work through a localhost website.

The real solution was to create an "api" local dns entry, that resolves to 127.0.0.1

http://host.docker.internal:8000/media/thumbnails/products/0053880_the-jet-set-tapping-silicone-rechargeable_03d5f97f_thumbnail_1024.webp

```sh
 curl http://host.docker.internal:8000/media/thumbnails/products/0053880_the-jet-set-tapping-silicone-rechargeable_03d5f97f_thumbnail_1024.webp -I

```
