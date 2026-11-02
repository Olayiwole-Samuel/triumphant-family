/** A small preview URL for admin lists (Cloudinary resizes on the fly; local files are shown as-is). */
export function thumbUrl(url: string, width = 640) {
  return url.includes("res.cloudinary.com/") && url.includes("/image/upload/")
    ? url.replace("/image/upload/", `/image/upload/f_auto,q_auto,c_limit,w_${width}/`)
    : url;
}
