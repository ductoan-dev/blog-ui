// First uploaded <video> and first <img> in a post's HTML content, used to
// preview a post in cards when it has no thumbnail
function getContentMedia(html) {
  if (typeof html !== "string") return { video: null, image: null };

  const video = html.match(/<video[^>]*\ssrc="([^"]+)"/i);
  const image = html.match(/<img[^>]*\ssrc="([^"]+)"/i);

  return { video: video ? video[1] : null, image: image ? image[1] : null };
}

export default getContentMedia;
