import { forwardRef, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import "./uploadVideoBlot";
import styles from "./RichTextEditor.module.scss";

// Stable defaults so useMemo below doesn't recompute on every render
const NO_CUSTOM_MODULES = {};
const NO_CUSTOM_FORMATS = [];

const RichTextEditor = forwardRef(
    (
        {
            value = "",
            onChange,
            placeholder = "Start writing...",
            className = "",
            error = "",
            readOnly = false,
            theme = "snow",
            modules: customModules = NO_CUSTOM_MODULES,
            formats: customFormats = NO_CUSTOM_FORMATS,
            onUploadMedia,
            ...props
        },
        ref
    ) => {
        // Keep the toolbar handlers stable: a new function on every render
        // would make ReactQuill rebuild the editor and lose focus
        const uploadMediaRef = useRef(onUploadMedia);
        uploadMediaRef.current = onUploadMedia;
        const canUploadMedia = Boolean(onUploadMedia);

        // Default toolbar configuration
        const modules = useMemo(
            () => ({
                toolbar: {
                    // Upload images/videos to the server instead of inlining base64
                    handlers: canUploadMedia
                        ? {
                              image: createUploadHandler("image", uploadMediaRef),
                              uploadVideo: createUploadHandler(
                                  "uploadVideo",
                                  uploadMediaRef
                              ),
                          }
                        : {},
                    container: [
                        [{ header: [1, 2, 3, false] }],
                        ["bold", "italic", "underline", "strike"],
                        [{ color: [] }, { background: [] }],
                        [{ list: "ordered" }, { list: "bullet" }],
                        [{ indent: "-1" }, { indent: "+1" }],
                        ["blockquote", "code-block"],
                        [
                            "link",
                            "image",
                            "video",
                            ...(canUploadMedia ? ["uploadVideo"] : []),
                        ],
                        [{ align: [] }],
                        ["clean"],
                    ],
                },
                clipboard: {
                    matchVisual: false,
                },
                ...customModules,
            }),
            [customModules, canUploadMedia]
        );

        // Default formats
        const formats = useMemo(() => {
            const defaultFormats = [
                "header",
                "bold",
                "italic",
                "underline",
                "strike",
                "color",
                "background",
                "list",
                "indent",
                "blockquote",
                "code-block",
                "link",
                "image",
                "video",
                "uploadVideo",
                "align",
            ];
            return customFormats.length > 0 ? customFormats : defaultFormats;
        }, [customFormats]);

        const editorClasses = `${styles.editor} ${className} ${
            error ? styles.error : ""
        }`.trim();

        return (
            <div className={styles.container}>
                <ReactQuill
                    ref={ref}
                    theme={theme}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    modules={modules}
                    formats={formats}
                    className={editorClasses}
                    {...props}
                />
                {error && <div className={styles.errorText}>{error}</div>}
            </div>
        );
    }
);

// Quill embed format -> media kind passed to onUploadMedia
const UPLOAD_KINDS = {
    image: { kind: "image", accept: "image/*" },
    uploadVideo: { kind: "video", accept: "video/*" },
};

// Opens a file picker, uploads via onUploadMedia(kind, file) and embeds the
// returned URL at the cursor
function createUploadHandler(format, uploadMediaRef) {
    const { kind, accept } = UPLOAD_KINDS[format];

    return function () {
        const quill = this.quill;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = accept;

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            const range = quill.getSelection(true);
            const url = await uploadMediaRef.current?.(kind, file);
            if (!url) return;

            quill.insertEmbed(range.index, format, url, "user");
            quill.setSelection(range.index + 1, 0, "silent");
        };

        input.click();
    };
}

RichTextEditor.displayName = "RichTextEditor";

RichTextEditor.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    className: PropTypes.string,
    error: PropTypes.string,
    readOnly: PropTypes.bool,
    theme: PropTypes.oneOf(["snow", "bubble"]),
    modules: PropTypes.object,
    formats: PropTypes.array,
    onUploadMedia: PropTypes.func,
};

export default RichTextEditor;
