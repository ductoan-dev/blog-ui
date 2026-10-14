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
            onUploadVideo,
            ...props
        },
        ref
    ) => {
        // Keep the toolbar handler stable: a new function on every render
        // would make ReactQuill rebuild the editor and lose focus
        const uploadVideoRef = useRef(onUploadVideo);
        uploadVideoRef.current = onUploadVideo;
        const canUploadVideo = Boolean(onUploadVideo);

        // Default toolbar configuration
        const modules = useMemo(
            () => ({
                toolbar: {
                    handlers: canUploadVideo
                        ? { uploadVideo: handleUploadVideo(uploadVideoRef) }
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
                            ...(canUploadVideo ? ["uploadVideo"] : []),
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
            [customModules, canUploadVideo]
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

// Opens a file picker, uploads via onUploadVideo and embeds the returned URL
function handleUploadVideo(uploadVideoRef) {
    return function () {
        const quill = this.quill;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "video/*";

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            const range = quill.getSelection(true);
            const url = await uploadVideoRef.current?.(file);
            if (!url) return;

            quill.insertEmbed(range.index, "uploadVideo", url, "user");
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
    onUploadVideo: PropTypes.func,
};

export default RichTextEditor;
