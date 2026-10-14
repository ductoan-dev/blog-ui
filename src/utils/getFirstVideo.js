// Returns the src of the first uploaded <video> in a post's HTML content
function getFirstVideo(html) {
  if (typeof html !== "string") return null;
  const match = html.match(/<video[^>]*\ssrc="([^"]+)"/i);
  return match ? match[1] : null;
}

export default getFirstVideo;
