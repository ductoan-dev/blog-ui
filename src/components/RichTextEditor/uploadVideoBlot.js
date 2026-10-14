import { Quill } from "react-quill-new";

const BlockEmbed = Quill.import("blots/block/embed");

// Uploaded files render as a native <video>; the built-in "video" format
// stays for YouTube/Vimeo links (iframe).
class UploadVideoBlot extends BlockEmbed {
  static blotName = "uploadVideo";
  static tagName = "video";
  static className = "ql-uploaded-video";

  static create(url) {
    const node = super.create();
    node.setAttribute("src", url);
    node.setAttribute("controls", "");
    node.setAttribute("preload", "metadata");
    node.setAttribute("playsinline", "");
    return node;
  }

  static value(node) {
    return node.getAttribute("src");
  }
}

Quill.register(UploadVideoBlot, true);

// Toolbar icon: camera with an upload arrow
Quill.import("ui/icons").uploadVideo = `<svg viewBox="0 0 18 18">
  <rect class="ql-stroke" x="1.5" y="4" width="11" height="10" rx="1.5"></rect>
  <polyline class="ql-stroke" points="12.5 7.5 16.5 5 16.5 13 12.5 10.5"></polyline>
  <polyline class="ql-stroke" points="5 9 7 7 9 9"></polyline>
  <line class="ql-stroke" x1="7" x2="7" y1="7" y2="11.5"></line>
</svg>`;

export default UploadVideoBlot;
